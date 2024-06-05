import json

# Load the data from the source file
with open('C:/Users/Lucien/Desktop/data science/Rank&DisplayQuestions/json/50EachRomance.json', 'r') as f:
    data = json.load(f)

# Access the 'questions' list in the data
questions = data['questions']

# Filter the 'True/False' questions
tf_questions = [q for q in questions if q.get('type') == 'True/False']

# Prepare the data in the desired format
formatted_data = {"True/False Questions": tf_questions}

# Save the 'True/False' questions to a new file in the desired format
with open('C:/Users/Lucien/Desktop/data science/Rank&DisplayQuestions/json/truFalQ1.json', 'w') as f:
    json.dump(formatted_data, f)
