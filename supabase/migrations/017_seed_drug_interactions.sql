-- Seed drug interactions: 50 clinically significant interaction pairs
-- Data researched from clinical sources (see docs/medication-research-sources.md)
-- Uses subqueries to look up medication IDs by generic_name
-- The CHECK constraint requires medication_id_1 < medication_id_2, so we use LEAST/GREATEST

INSERT INTO drug_interactions (medication_id_1, medication_id_2, severity, description)
SELECT LEAST(m1.id, m2.id), GREATEST(m1.id, m2.id), v.severity, v.description
FROM (VALUES
    -- MAJOR SEVERITY: Contraindicated or high-risk combinations
    ('Warfarin',        'Aspirin',          'major',    'Significantly increased bleeding risk when anticoagulant combined with antiplatelet - GI bleeding, intracranial hemorrhage risk'),
    ('Warfarin',        'Clopidogrel',      'major',    'Dual antithrombotic therapy dramatically increases bleeding risk - only use when specifically indicated (e.g., recent stent with AFib)'),
    ('Lisinopril',      'Losartan',         'major',    'Dual RAAS blockade increases risk of hyperkalemia, hypotension, and acute kidney injury - generally contraindicated'),
    ('Enalapril',       'Valsartan',        'major',    'Dual RAAS blockade increases risk of hyperkalemia, hypotension, and renal impairment - avoid combination'),
    ('Sertraline',      'Venlafaxine',      'major',    'Combining serotonergic agents increases risk of serotonin syndrome - monitor closely for hyperthermia, rigidity, autonomic instability'),
    ('Lorazepam',       'Alprazolam',       'major',    'Combining benzodiazepines increases CNS depression risk - respiratory depression, profound sedation, avoid combination'),
    ('Simvastatin',     'Verapamil',        'major',    'Verapamil inhibits CYP3A4 increasing simvastatin levels - increased risk of myopathy and rhabdomyolysis, limit simvastatin to 10mg'),
    ('Atorvastatin',    'Diltiazem',        'major',    'Diltiazem inhibits CYP3A4 increasing statin levels - increased myopathy risk, use lowest effective statin dose'),
    ('Warfarin',        'Omeprazole',       'moderate', 'Omeprazole may increase warfarin levels via CYP2C19 inhibition - monitor INR closely, increased bleeding risk'),
    ('Metoprolol',      'Verapamil',        'major',    'Additive negative inotropic and chronotropic effects - severe bradycardia, heart block, hypotension risk'),

    -- MODERATE SEVERITY: Monitoring required
    ('Metformin',       'Furosemide',       'moderate', 'Loop diuretics may reduce metformin efficacy and increase lactic acidosis risk via volume depletion and renal impairment'),
    ('Amlodipine',      'Simvastatin',      'moderate', 'Amlodipine increases simvastatin levels raising myopathy risk - limit simvastatin to 20mg daily with amlodipine'),
    ('Metoprolol',      'Amlodipine',       'moderate', 'Additive bradycardia and hypotension when beta blocker combined with calcium channel blocker - monitor vital signs'),
    ('Metoprolol',      'Insulin Glargine', 'moderate', 'Beta blockers mask hypoglycemia symptoms (tremor, tachycardia) - monitor glucose closely, educate on non-adrenergic symptoms'),
    ('Atenolol',        'Insulin Lispro',   'moderate', 'Beta blockers mask hypoglycemia warning signs - delayed recognition of low blood sugar, monitor glucose frequently'),
    ('Carvedilol',      'Metformin',        'moderate', 'Beta blockers may mask hypoglycemia symptoms in diabetic patients - increased risk of unrecognized hypoglycemia'),
    ('Lisinopril',      'Hydrochlorothiazide', 'minor', 'Additive hypotensive effect - monitor blood pressure, often used intentionally for synergistic effect'),
    ('Losartan',        'Hydrochlorothiazide', 'minor', 'Additive blood pressure lowering - commonly combined intentionally, monitor for hypotension'),
    ('Prednisone',      'Aspirin',          'moderate', 'Increased risk of GI bleeding and reduced aspirin effectiveness with concurrent corticosteroid use'),
    ('Warfarin',        'Levothyroxine',    'moderate', 'Thyroid hormones may increase warfarin effect - monitor INR when initiating or adjusting levothyroxine'),
    ('Glimepiride',     'Metformin',        'minor',    'Additive hypoglycemia risk when combining oral antidiabetics - monitor blood glucose closely'),
    ('Glyburide',       'Sitagliptin',      'minor',    'Additive glucose-lowering effect - monitor for hypoglycemia, especially in elderly'),
    ('Sertraline',      'Aspirin',          'moderate', 'SSRIs increase bleeding risk when combined with antiplatelet agents - monitor for bruising, bleeding'),
    ('Fluoxetine',      'Warfarin',         'moderate', 'SSRIs may potentiate warfarin effect - monitor INR closely, increased bleeding risk'),
    ('Venlafaxine',     'Clopidogrel',      'moderate', 'SNRIs increase bleeding risk with antiplatelets - monitor for signs of bleeding'),
    ('Lisinopril',      'Lithium',          'moderate', 'ACE inhibitors reduce lithium clearance increasing toxicity risk - monitor lithium levels closely'),
    ('Losartan',        'Lithium',          'moderate', 'ARBs reduce lithium clearance - risk of lithium toxicity, monitor levels and symptoms'),
    ('Furosemide',      'Lithium',          'major',    'Loop diuretics increase lithium levels via sodium depletion - high toxicity risk, monitor lithium levels'),
    ('Hydrochlorothiazide', 'Lithium',      'major',    'Thiazide diuretics significantly increase lithium levels - risk of toxicity, avoid combination or monitor closely'),
    ('Metoprolol',      'Diltiazem',        'major',    'Additive negative effects on heart rate and contractility - severe bradycardia, heart block risk'),
    ('Atenolol',        'Verapamil',        'major',    'Combined beta blocker and non-dihydropyridine CCB - severe bradycardia, hypotension, heart failure risk'),
    ('Amlodipine',      'Atorvastatin',     'minor',    'Amlodipine may slightly increase atorvastatin levels - generally well tolerated, monitor for myopathy'),
    ('Lisinopril',      'Empagliflozin',    'moderate', 'Combined RAAS inhibitor and SGLT2i increases hyperkalemia risk - monitor potassium and renal function'),
    ('Losartan',        'Dapagliflozin',    'moderate', 'ARB with SGLT2 inhibitor increases volume depletion and hypotension risk - monitor blood pressure'),
    ('Metformin',       'Empagliflozin',    'minor',    'Commonly combined for diabetes - additive glucose lowering, monitor for hypoglycemia and volume depletion'),
    ('Sitagliptin',     'Metformin',        'minor',    'Commonly combined DPP-4 inhibitor with metformin - generally well tolerated, monitor glucose'),
    ('Linagliptin',     'Insulin Glargine', 'moderate', 'DPP-4 inhibitor with insulin increases hypoglycemia risk - monitor glucose, may need insulin dose reduction'),
    ('Semaglutide',     'Metformin',        'minor',    'GLP-1 agonist with metformin commonly combined - additive glucose lowering, GI side effects may be additive'),
    ('Liraglutide',     'Insulin Lispro',   'moderate', 'GLP-1 agonist with insulin increases hypoglycemia risk - monitor glucose closely, insulin dose reduction often needed'),
    ('Albuterol',       'Metoprolol',       'moderate', 'Beta blockers may reduce bronchodilator efficacy and increase bronchospasm risk - use cardioselective beta blockers'),
    ('Salmeterol',      'Atenolol',         'moderate', 'Non-selective beta blockers antagonize LABA effects - avoid combination, use cardioselective if needed'),
    ('Fluticasone',     'Ritonavir',        'major',    'CYP3A4 inhibitors dramatically increase inhaled steroid levels - risk of Cushing syndrome, adrenal suppression'),
    ('Warfarin',        'Fluconazole',      'major',    'Azole antifungals inhibit warfarin metabolism - significantly increased INR and bleeding risk, monitor closely'),
    ('Apixaban',        'Aspirin',          'moderate', 'DOAC with antiplatelet increases bleeding risk - use only when indicated, monitor for bleeding'),
    ('Rivaroxaban',     'Clopidogrel',      'moderate', 'DOAC with P2Y12 inhibitor increases bleeding risk - dual therapy only when specifically indicated'),
    ('Dabigatran',      'Aspirin',          'moderate', 'Direct thrombin inhibitor with antiplatelet - increased bleeding risk, use lowest effective doses'),
    ('Ticagrelor',      'Aspirin',          'minor',    'Dual antiplatelet therapy for ACS - intentional combination, monitor for bleeding'),
    ('Rosuvastatin',    'Gemfibrozil',      'major',    'Fibrates increase statin levels - severe myopathy and rhabdomyolysis risk, avoid combination'),
    ('Pravastatin',     'Niacin',           'moderate', 'Combination increases myopathy risk - monitor CK levels, educate on muscle pain symptoms'),
    ('Duloxetine',      'Sertraline',       'major',    'Combining serotonergic agents increases serotonin syndrome risk - avoid combination or monitor very closely'),
    ('Venlafaxine',     'Tramadol',         'major',    'SNRI with serotonergic opioid - high serotonin syndrome risk, avoid combination')
) AS v(name1, name2, severity, description)
JOIN medications m1 ON m1.generic_name = v.name1
JOIN medications m2 ON m2.generic_name = v.name2
ON CONFLICT (medication_id_1, medication_id_2) DO NOTHING;
