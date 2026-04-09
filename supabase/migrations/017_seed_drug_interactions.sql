-- Seed drug interactions: 10 known interaction pairs
-- Uses subqueries to look up medication IDs by generic_name
-- The CHECK constraint requires medication_id_1 < medication_id_2, so we use LEAST/GREATEST

INSERT INTO drug_interactions (medication_id_1, medication_id_2, severity, description)
SELECT LEAST(m1.id, m2.id), GREATEST(m1.id, m2.id), v.severity, v.description
FROM (VALUES
    ('Warfarin',      'Aspirin',          'major',           'Increased risk of bleeding when anticoagulant is combined with antiplatelet'),
    ('Warfarin',      'Clopidogrel',      'major',           'Significantly increased bleeding risk with dual antithrombotic therapy'),
    ('Lisinopril',    'Losartan',         'major',           'Dual RAAS blockade increases risk of hypotension, hyperkalemia, and renal impairment'),
    ('Metformin',     'Furosemide',       'moderate',        'Loop diuretics may reduce metformin efficacy and increase lactic acidosis risk'),
    ('Amlodipine',    'Simvastatin',      'moderate',        'Amlodipine increases simvastatin levels, raising risk of myopathy and rhabdomyolysis'),
    ('Lisinopril',    'Hydrochlorothiazide', 'minor',        'Additive hypotensive effect — monitor blood pressure; often used intentionally'),
    ('Warfarin',      'Omeprazole',       'moderate',        'Omeprazole may increase warfarin levels and bleeding risk via CYP2C19 inhibition'),
    ('Metoprolol',    'Amlodipine',       'moderate',        'Additive bradycardia and hypotension when beta blocker combined with calcium channel blocker'),
    ('Glimepiride',   'Metformin',        'minor',           'Additive hypoglycemia risk — monitor blood glucose closely when combining oral antidiabetics'),
    ('Prednisone',    'Aspirin',          'moderate',        'Increased risk of GI bleeding and reduced aspirin effectiveness with concurrent corticosteroid use')
) AS v(name1, name2, severity, description)
JOIN medications m1 ON m1.generic_name = v.name1
JOIN medications m2 ON m2.generic_name = v.name2
ON CONFLICT (medication_id_1, medication_id_2) DO NOTHING;
