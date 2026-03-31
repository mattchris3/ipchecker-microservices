from flask import Flask, request, jsonify
from flask_cors import CORS
from functions import countries_list

app = Flask(__name__)

CORS(app) 
@app.route('/', methods=['GET'])
def find_countries():
    items = request.args.get('items', '')
    result = countries_list(items)
    return jsonify(result)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)