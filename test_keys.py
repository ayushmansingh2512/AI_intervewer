import google.generativeai as genai
import os

keys = [
    'AIzaSyCyWU60cviqlrNOHV4Po2LT0A_K8O1l62o',
    'AIzaSyBlz8x7usOpRyqRXC_44wSiJAujP5NM8-I',
    'AIzaSyDp4kbMCIFsq-Uqd7uiid-jcfDYMShGO7Qs',
    'AIzaSyDjcgRVYzJnz5qOfMhvEEu7_MoL4p7feNs'
]

for key in keys:
    print(f"Testing {key[:10]}...")
    genai.configure(api_key=key)
    try:
        models = genai.list_models()
        # Just try to get the first model to verify
        next(models)
        print(">>> WORKING!")
    except Exception as e:
        print(f"FAILED: {e}")
    print("-" * 20)
