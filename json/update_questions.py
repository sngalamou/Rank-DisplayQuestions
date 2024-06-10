import json

# Load the JSON file
with open('compiled_questions.json', 'r') as file:
    data = json.load(file)

# Extract the questions
questions = data['questions']

# Define the types and subtypes based on the provided snippets
romantic_types = {
    "Romantic": ["Traditional Romantic", "Passionate Romantic"],
    "Realist": ["Pragmatic Partner", "Steady Supporter"],
    "Idealist": ["Dreamy Idealist", "Optimistic Lover"],
    "Cynic": ["Guarded Skeptic", "Disillusioned Realist"],
    "Additional Types": ["Companionate", "Adventurous", "Guarded", "Visionary Idealist", "Disenchanted Cynic"]
}

love_languages = {
    "Words of Affirmation": ["Encouraging Words", "Deep Conversations"],
    "Acts of Service": ["Daily Tasks", "Grand Gestures"],
    "Receiving Gifts": ["Personalized Gifts", "Extravagant Gifts"],
    "Quality Time": ["Shared Activities", "Focused Conversations"],
    "Physical Touch": ["Casual Touch", "Intimate Touch"],
    "Intellectual Connection": [],
    "Spiritual Bonding": []
}

# Function to match question to type/subtype
def match_question_to_type(question_text):
    for type_, subtypes in romantic_types.items():
        for subtype in subtypes:
            if subtype.lower() in question_text.lower():
                return subtype, 10
    for type_, subtypes in love_languages.items():
        for subtype in subtypes:
            if subtype.lower() in question_text.lower():
                return subtype, 10
        if type_.lower() in question_text.lower():
            return type_, 8
    return "Unknown", 0

# Analyze and grade each question
graded_questions = []

for question in questions:
    question_text = question["question"]
    matched_type, score = match_question_to_type(question_text)
    
    graded_question = {
        "question": question_text,
        "matched_type": matched_type,
        "score": score
    }
    
    graded_questions.append(graded_question)

# Create a new JSON with the graded questions
graded_json = {"graded_questions": graded_questions}

# Save the graded questions to a new JSON file
with open('graded_questions.json', 'w') as file:
    json.dump(graded_json, file)

graded_json
