import json

def replace_weights(file1, file2):
    # Load the data from the files
    with open(file1, 'r') as f:
        dict1 = json.load(f)
    with open(file2, 'r') as f:
        dict2 = json.load(f)

    # Convert list2 into a dictionary for easy lookup
    list2_dict = {json.dumps({k: v for k, v in q.items() if k != 'responses'}, sort_keys=True): q for q in dict2["Multiple Choice Questions"]}

    result = []

    for question in dict1["Multiple Choice Questions"]:
        # Convert the question to a string format (excluding responses)
        question_str = json.dumps({k: v for k, v in question.items() if k != 'responses'}, sort_keys=True)

        # If the question exists in list2, replace the weights
        if question_str in list2_dict:
            for key in ["HRweight", "LLweight", "RTweight"]:
                if key in list2_dict[question_str]['weights']:
                    question['weights'][key] = list2_dict[question_str]['weights'][key]

        result.append(question)

    # Save the result back to file1
    with open(file1, 'w') as f:
        json.dump({"Multiple Choice Questions": result}, f, indent=2)

# Replace weights
replace_weights('multipleChoice.json', 'multiplechoice_noOptions.json')
