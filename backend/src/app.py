from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import io

app = Flask(__name__)
CORS(app)

@app.route("/")
def home() :
    return jsonify({"message" : "Data migration tool api is running!"})

@app.route("/api/upload", methods=["POST"])
def upload_csv() :
    # check file present
    if "file" not in request.files :
        return jsonify ({"error" : "No file uploaded"}), 400
    
    file = request.files["file"]

    # check if file is csv
    if not file.filename.endswith(".csv") :
        return jsonify ({"error" : "Only CSV files allowed"}), 400
    
    # Read CSV into pandas
    content = file.read().decode("utf-8")
    df = pd.read_csv(io.StringIO(content))
    df.columns = df.columns.str.strip()

    #basic
    total_rows = len(df)
    columns = list(df.columns)

    #detect data types
    dtypes = {}
    for col in df.columns:
        dtypes[col] = str (df[col].dtype)

    # Find missing values
    missing = {}
    for col in df.columns:
        missing_count = int(df[col].isnull().sum())
        if missing_count > 0:
            missing[col] = missing_count

    # preview 
    preview = df.head(5).fillna('NULL').to_dict(orient='records')

    return jsonify({
        "success": True,
        "total_rows" : total_rows,
        "columns" : columns,
        "data_types" : dtypes,
        "missing_values" : missing,
        "preview" : preview
    })

@app.route('/api/transform', methods=['POST'])
def transform_csv():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    content = file.read().decode('utf-8')
    df = pd.read_csv(io.StringIO(content))
    
    # Clean column names
    df.columns = df.columns.str.strip()

    # Track what we cleaned
    original_rows = len(df)
    
    # Remove duplicate rows
    df.drop_duplicates(inplace=True)
    
    # Strip whitespace from string columns
    for col in df.select_dtypes(include='object').columns:
        df[col] = df[col].str.strip()

    # Fill missing values
    for col in df.columns:
        if df[col].dtype == 'float64' or df[col].dtype == 'int64':
            df[col] = df[col].fillna(0)
        else:
            df[col] = df[col].fillna('N/A')

    cleaned_rows = len(df)
    duplicates_removed = original_rows - cleaned_rows

    return jsonify({
        "success": True,
        "original_rows": original_rows,
        "cleaned_rows": cleaned_rows,
        "duplicates_removed": duplicates_removed,
        "data": df.to_dict(orient='records')
    })


@app.route('/api/export/json', methods=['POST'])
def export_json():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    content = file.read().decode('utf-8')
    df = pd.read_csv(io.StringIO(content))
    df.columns = df.columns.str.strip()

    # Clean data before export
    for col in df.columns:
        if df[col].dtype == 'float64' or df[col].dtype == 'int64':
            df[col] = df[col].fillna(0)
        else:
            df[col] = df[col].fillna('N/A')

    return jsonify({
        "success": True,
        "total_rows": len(df),
        "exported_data": df.to_dict(orient='records')
    })


@app.route('/api/export/sql', methods=['POST'])
def export_sql():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    content = file.read().decode('utf-8')
    df = pd.read_csv(io.StringIO(content))
    df.columns = df.columns.str.strip()

    # Clean data
    for col in df.columns:
        if df[col].dtype == 'float64' or df[col].dtype == 'int64':
            df[col] = df[col].fillna(0)
        else:
            df[col] = df[col].fillna('N/A')

    # Generate SQL INSERT statements
    table_name = "migrated_data"
    columns = ', '.join(df.columns)
    sql_statements = []

    for _, row in df.iterrows():
        values = []
        for val in row:
            if isinstance(val, str):
                values.append(f"'{val}'")
            else:
                values.append(str(val))
        values_str = ', '.join(values)
        sql_statements.append(
            f"INSERT INTO {table_name} ({columns}) VALUES ({values_str});"
        )

    return jsonify({
        "success": True,
        "total_rows": len(df),
        "table_name": table_name,
        "sql_statements": sql_statements
    })

if __name__ == "__main__":
    app.run(debug=True)