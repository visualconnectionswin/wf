from flask import Flask, request, jsonify
import subprocess
import os
import uuid

app = Flask(__name__)

@app.route('/score', methods=['POST'])
def get_score():
    data = request.get_json()
    documento = data.get('documento')
    if not documento:
        return jsonify({'error': 'Falta el campo documento'}), 400

    # Crear un archivo temporal con el documento solicitado
    script_dir = os.path.dirname(os.path.abspath(__file__))
    temp_script = os.path.join(script_dir, f'score_temp_{uuid.uuid4().hex}.py')
    with open(os.path.join(script_dir, 'score.py'), 'r', encoding='utf-8') as f:
        code = f.read()
    # Reemplazar el valor de DOCUMENTO
    code = code.replace(
        next(line for line in code.splitlines() if line.strip().startswith('DOCUMENTO = ')),
        f"DOCUMENTO = '{documento}'  # número de documento a consultar"
    )
    with open(temp_script, 'w', encoding='utf-8') as f:
        f.write(code)

    # Ejecutar el script temporal
    try:
        result = subprocess.run(
            ['python', temp_script],
            capture_output=True, text=True, timeout=60
        )
        output = result.stdout + '\n' + result.stderr
    except Exception as e:
        output = str(e)
    finally:
        os.remove(temp_script)

    return jsonify({'output': output})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
