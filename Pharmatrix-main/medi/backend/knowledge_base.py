# knowledge_base.py

# A curated list of common medicines with rich, hardcoded details.
# This acts as a "Local Model" to ensure high accuracy and specific instructions
# that generic APIs might miss.

MEDICINE_DB = {
    "DOLO": {
        "name": "Dolo 650",
        "generic_name": "Paracetamol (Acetaminophen)",
        "purpose": "Fever and mild to moderate pain (Headache, Body ache).",
        "food_instruction": "Take AFTER food to avoid gastric irritation.",
        "warnings": "Do not exceed 4g per day. Overdose can cause liver damage. Avoid alcohol."
    },
    "CROCIN": {
        "name": "Crocin Advance",
        "generic_name": "Paracetamol",
        "purpose": "Fever and Headache relief.",
        "food_instruction": "Take AFTER food.",
        "warnings": "Consult a doctor if fever persists for more than 3 days."
    },
    "CALPOL": {
        "name": "Calpol",
        "generic_name": "Paracetamol",
        "purpose": "Fever and Pain relief in children and adults.",
        "food_instruction": "Take AFTER food.",
        "warnings": "Ensure correct dosage based on weight for children."
    },
    "COMBIFLAM": {
        "name": "Combiflam",
        "generic_name": "Ibuprofen + Paracetamol",
        "purpose": "Pain relief (Muscle ache, dental pain) and Fever.",
        "food_instruction": "Take STRICTLY AFTER food.",
        "warnings": "Avoid if you have ulcers or asthma. Can cause stomach upset."
    },
    "MEFTAL": {
        "name": "Meftal Spas",
        "generic_name": "Mefenamic Acid",
        "purpose": "Menstrual pain (period cramps) and stomach pain.",
        "food_instruction": "Take with or after food.",
        "warnings": "Do not use for more than 7 days without medical advice."
    },
    "PANTOP": {
        "name": "Pantop 40",
        "generic_name": "Pantoprazole",
        "purpose": "Acidity, Heartburn, and GERD.",
        "food_instruction": "Take on an EMPTY STOMACH, 30 mins BEFORE breakfast.",
        "warnings": "Long-term use requires monitoring of Magnesium levels."
    },
    "PAN": {
        "name": "Pan 40/D",
        "generic_name": "Pantoprazole / Domperidone",
        "purpose": "Acidity and Gas relief.",
        "food_instruction": "Take on an EMPTY STOMACH, 30 mins BEFORE food.",
        "warnings": "Consult doctor if pregnant."
    },
    "OMEE": {
        "name": "Omee",
        "generic_name": "Omeprazole",
        "purpose": "Acidity, Heartburn.",
        "food_instruction": "Take on an EMPTY STOMACH, before morning meal.",
        "warnings": ""
    },
    "AZITHRAL": {
        "name": "Azithral 500",
        "generic_name": "Azithromycin",
        "purpose": "Bacterial Antibiotic (Throat infection, Lungs).",
        "food_instruction": "Take 1 hour before or 2 hours after food.",
        "warnings": "Complete the full course even if you feel better. associated with heart rhythm issues in rare cases."
    },
    "AUGMENTIN": {
        "name": "Augmentin 625",
        "generic_name": "Amoxycillin + Clavulanic Acid",
        "purpose": "Bacterial Infection.",
        "food_instruction": "Take WITH food to reduce stomach upset.",
        "warnings": "Complete full course. Report any skin rash immediately."
    },
    "CETRIZINE": {
        "name": "Cetrizine",
        "generic_name": "Cetirizine",
        "purpose": "Allergy (Runny nose, sneezing, itching).",
        "food_instruction": "Can be taken with or without food.",
        "warnings": "May cause DROWSINESS. Do not drive or operate machinery."
    },
    "ALLEGRA": {
        "name": "Allegra",
        "generic_name": "Fexofenadine",
        "purpose": "Non-drowsy Allergy relief.",
        "food_instruction": "Take with water. Avoid fruit juices.",
        "warnings": "Generally safe, does not cause sedation."
    },
    "DISPRIN": {
        "name": "Disprin",
        "generic_name": "Aspirin (Soluble)",
        "purpose": "Headache, Heart protection.",
        "food_instruction": "Dissolve in water and drink. Take with food.",
        "warnings": "Not for children under 16 (Reye's syndrome risk). Avoid with bleeding disorders."
    },
    "SARIDON": {
        "name": "Saridon",
        "generic_name": "Paracetamol + Propyphenazone + Caffeine",
        "purpose": "Severe Headache.",
        "food_instruction": "Take after light food.",
        "warnings": "Limit usage. Caffeine may cause sleeplessness."
    },
    "VICKS": {
        "name": "Vicks Action 500",
        "generic_name": "Paracetamol + Phenylephrine + Caffeine",
        "purpose": "Cold, Headache, Blocked Nose.",
        "food_instruction": "Take after food.",
        "warnings": "Do not take with other Paracetamol products."
    },
    "ASCORIL": {
        "name": "Ascoril LS/D",
        "generic_name": "Ambroxol + Levasalbutamol + Guaiphenesin",
        "purpose": "Cough Syrup (Wet cough/Bronchitis).",
        "food_instruction": "Take after food. Shake well.",
        "warnings": "May cause slight tremors or rapid heartbeat."
    },
    "BENADRYL": {
        "name": "Benadryl",
        "generic_name": "Diphenhydramine",
        "purpose": "Dry Cough, Allergy.",
        "food_instruction": "Take after food.",
        "warnings": "Causes DROWSINESS. Good for night cough."
    },
    "VOLINI": {
        "name": "Volini Spray/Gel",
        "generic_name": "Diclofenac",
        "purpose": "Pain relief spray for Muscles/Joints.",
        "food_instruction": "External use only.",
        "warnings": "Do not apply on open wounds or cuts."
    },
    "DIGENE": {
        "name": "Digene",
        "generic_name": "Antacid",
        "purpose": "Acidity, Gas, Bloating.",
        "food_instruction": "Chew properly after meals.",
        "warnings": "Do not take for more than 2 weeks continuously."
    },
    "THYRONORM": {
        "name": "Thyronorm",
        "generic_name": "Thyroxine",
        "purpose": "Hypothyroidism (Thyroid supplement).",
        "food_instruction": "Take FIRST thing in morning on EMPTY STOMACH.",
        "warnings": "Wait 45 mins before breakfast/tea. Regular TSH monitoring needed."
    }
}

# Common OCR Typos/Misreadings to correct
OCR_CORRECTIONS = {
    "D0LO": "DOLO",
    "D0L0": "DOLO",
    "DOO": "DOLO",
    "DOL0": "DOLO",
    "PANT0P": "PANTOP",
    "CR0CIN": "CROCIN",
    "AZ1THRAL": "AZITHRAL",
    "MEFTAL-SPAS": "MEFTAL",
    "DOLO-650": "DOLO"
}
