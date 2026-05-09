import google.generativeai as genai
import os

keys = [
    'AIzaSyCyWU60cviqlrNOHV4Po2LT0A_K8O1l62o',
    'AIzaSyBlz8x7usOpRyqRXC_44wSiJAujP5NM8-I',
    'AIzaSyDp4kbMCIFsq-Uqd7uiid-jcfDYMShGO7Qs',
    'AIzaSyDjcgRVYzJnz5qOfMhvEEu7_MoL4p7feNs'
]

for key in keys:
    genai.configure(api_key=key)
    try:
        next(genai.list_models())
        print(f"{key[:10]}: WORKING")
    except Exception as e:
        err_msg = str(e).split('\n')[0]
        print(f"{key[:10]}: FAILED - {err_msg}")
