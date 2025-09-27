from flask import Flask, request, render_template, jsonify
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from joblib import dump, load
import os

app = Flask(__name__)

# === Configuration for Multiple Diseases ===
DISEASE_CONFIG = {
    'heart_attack': {
        'model_path': 'heart_attack_model.joblib',
        'dataset_path': r"health_risk_assessment\updated_version.csv",
        'display_name': 'Heart Attack'
    },
    # === Example for adding another illness ===
    # 'stroke': {
    #     'model_path': 'stroke_model.joblib',
    #     'dataset_path': r"path\to\your\stroke_data.csv",
    #     'display_name': 'Stroke'
    # }
}

# === ML Model Loading / Training ===
def load_or_train_model(target_column, model_path, dataset_path):
    """Loads a pre-trained model or trains a new one if not found."""
    if os.path.exists(model_path):
        print(f"Loading existing model for {target_column} from {model_path}...")
        rf, imputer, feature_names, acc = load(model_path)
        print(f"Model for {target_column} loaded. Accuracy: {acc*100:.2f}%")
        return rf, imputer, feature_names, acc

    print(f"No existing model found for {target_column}. Training a new one...")
    # Read dataset
    if not os.path.exists(dataset_path):
        print(f"ERROR: Dataset not found at {dataset_path}")
        return None, None, None, None

    df = pd.read_csv(dataset_path)
    X = df.drop(columns=[target_column])
    y = df[target_column]
    feature_names = X.columns.tolist()

    # Handle missing values
    imputer = SimpleImputer(strategy="mean")
    X_imputed = pd.DataFrame(imputer.fit_transform(X), columns=feature_names)

    X_train, X_test, y_train, y_test = train_test_split(
        X_imputed, y, test_size=0.3, random_state=42, stratify=y
    )

    rf = RandomForestClassifier(n_estimators=100, random_state=42)
    rf.fit(X_train, y_train)

    acc = accuracy_score(y_test, rf.predict(X_test))
    print(f"Model for {target_column} trained. Accuracy: {acc*100:.2f}%")

    dump((rf, imputer, feature_names, acc), model_path)
    print(f"Model for {target_column} saved to {model_path}")
    return rf, imputer, feature_names, acc

# Load or train the model at startup
models = {}
all_feature_names = []
for disease, config in DISEASE_CONFIG.items():
    rf, imputer, feature_names, acc = load_or_train_model(disease, config['model_path'], config['dataset_path'])
    if rf:
        models[disease] = {'model': rf, 'imputer': imputer, 'accuracy': acc, 'display_name': config['display_name']}
        if not all_feature_names: # Store feature names from the first model
            all_feature_names = feature_names

# === Flask Routes ===
@app.route("/", methods=["GET"])
def index():
    # Assuming all models use the same features for the form
    return render_template("input_form.html", features=all_feature_names)

@app.route("/predict", methods=["POST"])
def predict():
    values = []
    user_inputs = {}
    try:
        # collect user input values
        for feat in all_feature_names:
            val = request.form.get(feat, "").strip()
            user_inputs[feat] = val # Store raw input for suggestions
            processed_val = None

            if val: # Only process if the value is not an empty string
                if feat == 'sex':
                    processed_val = 1.0 if val.lower() == 'male' else 0.0
                elif feat in ['smoking', 'diabetes']:
                    processed_val = 1.0 if val.lower() == 'yes' else 0.0
                else:
                    processed_val = float(val)

            # Handle empty strings as missing values, otherwise convert to float
            values.append(processed_val)

        input_df = pd.DataFrame([values], columns=all_feature_names)
        
        predictions = []
        for disease, model_data in models.items():
            # Impute missing values using the specific imputer for that model
            imputer = model_data['imputer']
            input_imputed = pd.DataFrame(imputer.transform(input_df), columns=all_feature_names)

            # Make prediction
            model = model_data['model']
            pred = model.predict(input_imputed)[0]
            proba = model.predict_proba(input_imputed)[0][1] * 100
            display_name = model_data['display_name']
            label_text = f"High Risk of {display_name}" if pred == 1 else f"Low Risk of {display_name}"

            predictions.append({
                'name': display_name,
                'label': label_text,
                'probability': proba,
                'accuracy': model_data['accuracy']
            })

        # === Rule-based Assessments ===
        assessments = []
        # Helper to safely convert to float
        def to_float(s):
            try:
                return float(s)
            except (ValueError, TypeError):
                return None

        # --- Critical Illness Risk Assessments based on individual factors ---

        # Cardiovascular Disease Risk (from Cholesterol)
        total_chol = to_float(user_inputs.get('total_cholesterol'))
        ldl = to_float(user_inputs.get('ldl'))
        hdl = to_float(user_inputs.get('hdl'))
        chol_risk = (total_chol is not None and total_chol > 200) or \
                    (ldl is not None and ldl > 130) or \
                    (hdl is not None and hdl < 40)
        if chol_risk:
            chol_values = f"Total: {total_chol or 'N/A'}, LDL: {ldl or 'N/A'}, HDL: {hdl or 'N/A'}"
            assessments.append({'name': 'Cardiovascular Disease (Heart Attack, Stroke)', 'label': 'Increased Risk', 'status': 'high-risk', 'value': f"Abnormal Cholesterol ({chol_values})", 'recommendation': 'High cholesterol contributes to plaque buildup in arteries (atherosclerosis), a primary cause of heart attacks and strokes. Lifestyle changes and medical consultation are advised.'})

        # Hypertension-related Risk (from Blood Pressure)
        systolic = to_float(user_inputs.get('systolic_bp'))
        diastolic = to_float(user_inputs.get('diastolic_bp'))
        bp_risk = (systolic is not None and systolic > 130) or \
                  (diastolic is not None and diastolic > 80)
        if bp_risk:
            bp_value = f"{systolic or 'N/A'}/{diastolic or 'N/A'} mmHg"
            assessments.append({'name': 'Hypertension-Related Illness (Stroke, Heart/Kidney Failure)', 'label': 'Increased Risk', 'status': 'high-risk', 'value': f"Elevated Blood Pressure ({bp_value})", 'recommendation': 'Sustained high blood pressure can damage blood vessels and organs, leading to stroke, heart failure, or kidney failure. Regular monitoring and medical advice are crucial.'})

        # Smoking-related Risk
        if user_inputs.get('smoking'):
            if user_inputs['smoking'] == 'Yes':
                assessments.append({'name': 'Lung Cancer & Respiratory Disease', 'label': 'Increased Risk', 'status': 'high-risk', 'value': "Current Smoker", 'recommendation': 'Smoking is the leading cause of preventable death and is directly linked to lung cancer, COPD, and heart disease. Quitting is the most effective way to reduce this risk.'})

        # Diabetes-related Complications Risk
        if user_inputs.get('diabetes'):
            if user_inputs['diabetes'] == 'Yes':
                assessments.append({'name': 'Diabetes-Related Complications (Kidney Failure, Blindness, Neuropathy)', 'label': 'Increased Risk', 'status': 'high-risk', 'value': "Diagnosed with Diabetes", 'recommendation': 'Uncontrolled diabetes can lead to severe complications affecting the kidneys, eyes, and nerves. Strict blood sugar management is essential to mitigate these risks.'})

        # Add a message if no specific risks were flagged
        if not assessments:
            assessments.append({'name': 'Individual Risk Factors', 'label': 'No Specific Risks Flagged', 'status': 'low-risk', 'value': "Within Normal Ranges", 'recommendation': 'Based on the provided values, no specific critical illness risk factors were flagged by our rule-based checks. Continue to maintain a healthy lifestyle.'})

        return render_template("result.html", predictions=predictions, user_inputs=user_inputs, assessments=assessments)

    except ValueError:
        # Handle cases where input is not a valid number
        error_message = "Invalid input. Please ensure all fields contain only numbers."
        return render_template("input_form.html", features=all_feature_names, error=error_message)
    except Exception as e:
        return f"An unexpected error occurred: {e}"

@app.route("/api/predict", methods=["POST"])
def api_predict():
    """
    API endpoint to accept JSON data and return JSON predictions.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON payload"}), 400

        # --- Map incoming JSON to feature names ---
        # Note: The model requires 'age', which was not in the provided Java class.
        # We assume 'age' will be included in the JSON payload.
        required_keys = all_feature_names + ['user_id']
        if not all(key in data for key in required_keys):
             return jsonify({"error": f"Missing required keys. Expecting: {required_keys}"}), 400

        user_inputs = {
            'age': data.get('age'),
            'sex': 'Male' if data.get('sex') == 1 else 'Female',
            'total_cholesterol': data.get('total_cholesterol'),
            'ldl': data.get('ldl'),
            'hdl': data.get('hdl'),
            'systolic_bp': data.get('systolic_bp'),
            'diastolic_bp': data.get('diastolic_bp'),
            'smoking': 'Yes' if data.get('smoking') == 1 else 'No',
            'diabetes': 'Yes' if data.get('diabetes') == 1 else 'No'
        }

        # --- Process inputs for the model (similar to the form-based predict) ---
        values = []
        for feat in all_feature_names:
            val = data.get(feat)
            # The model expects float values for all features after encoding
            values.append(float(val) if val is not None else None)

        input_df = pd.DataFrame([values], columns=all_feature_names)

        # --- Machine Learning Predictions ---
        ml_predictions = []
        for disease, model_data in models.items():
            imputer = model_data['imputer']
            input_imputed = pd.DataFrame(imputer.transform(input_df), columns=all_feature_names)

            model = model_data['model']
            pred = model.predict(input_imputed)[0]
            proba = model.predict_proba(input_imputed)[0][1] * 100

            ml_predictions.append({
                'illness': model_data['display_name'],
                'is_high_risk': bool(pred == 1),
                'risk_probability': round(proba, 2),
                'model_accuracy': round(model_data['accuracy'] * 100, 2)
            })

        # --- Rule-based Assessments ---
        assessments = []
        def to_float(s):
            try: return float(s)
            except (ValueError, TypeError): return None

        total_chol = to_float(user_inputs.get('total_cholesterol'))
        ldl = to_float(user_inputs.get('ldl'))
        hdl = to_float(user_inputs.get('hdl'))
        if (total_chol is not None and total_chol > 200) or (ldl is not None and ldl > 130) or (hdl is not None and hdl < 40):
            assessments.append({'risk_factor': 'Abnormal Cholesterol', 'potential_illness': 'Cardiovascular Disease (Heart Attack, Stroke)', 'details': 'High cholesterol contributes to plaque buildup in arteries (atherosclerosis).'})

        systolic = to_float(user_inputs.get('systolic_bp'))
        diastolic = to_float(user_inputs.get('diastolic_bp'))
        if (systolic is not None and systolic > 130) or (diastolic is not None and diastolic > 80):
            assessments.append({'risk_factor': 'Elevated Blood Pressure', 'potential_illness': 'Hypertension-Related Illness (Stroke, Heart/Kidney Failure)', 'details': 'Sustained high blood pressure can damage blood vessels and organs.'})

        if user_inputs.get('smoking') == 'Yes':
            assessments.append({'risk_factor': 'Smoking', 'potential_illness': 'Lung Cancer & Respiratory Disease', 'details': 'Smoking is a leading cause of preventable death and is directly linked to cancer, COPD, and heart disease.'})

        if user_inputs.get('diabetes') == 'Yes':
            assessments.append({'risk_factor': 'Diabetes', 'potential_illness': 'Diabetes-Related Complications (Kidney Failure, Blindness)', 'details': 'Uncontrolled diabetes can lead to severe complications affecting major organs.'})

        # --- Construct Final JSON Response ---
        response_data = {
            'user_id': data.get('user_id'),
            'ml_predictions': ml_predictions,
            'rule_based_assessments': assessments
        }

        return jsonify(response_data)

    except (ValueError, TypeError) as e:
        return jsonify({"error": "Invalid data type in payload. Ensure all values are numbers.", "details": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "An unexpected error occurred", "details": str(e)}), 500

if __name__ == "__main__":
    # By running on host='0.0.0.0', the app becomes accessible
    # to other devices on the same network via your computer's IP address.
    # Running on port 5001 to avoid conflicts with PDF extractor (port 5000)
    app.run(host='0.0.0.0', port=5001, debug=True)
