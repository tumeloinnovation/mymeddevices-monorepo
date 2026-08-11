export const CARE_SETTING_TAGS = [
  { key: 'care_setting:home_care', label: 'Home Care', description: 'Patient home use & mobility' },
  { key: 'care_setting:clinic', label: 'Primary Clinic', description: 'Outpatient clinics & consultation' },
  { key: 'care_setting:hospital_ward', label: 'Hospital Ward', description: 'General inpatient wards' },
  { key: 'care_setting:icu', label: 'ICU & Critical Care', description: 'Intensive care & life support' },
  { key: 'care_setting:ambulance', label: 'Ambulance & Emergency', description: 'Emergency response & transport' },
  { key: 'care_setting:lab', label: 'Diagnostic Laboratory', description: 'Labs & testing facilities' },
] as const;

export const CONDITION_TAGS = [
  { key: 'condition:respiratory', label: 'Respiratory Care', description: 'Asthma, COPD, oxygen therapy' },
  { key: 'condition:cardiovascular', label: 'Cardiovascular', description: 'Hypertension, cardiac monitoring' },
  { key: 'condition:diabetes', label: 'Diabetes Care', description: 'Glucose monitoring & insulin care' },
  { key: 'condition:orthopedic', label: 'Orthopedic & Mobility', description: 'Rehab, braces, wheelchairs' },
  { key: 'condition:wound_care', label: 'Wound & Surgical Care', description: 'Dressings, sutures, sterilization' },
  { key: 'condition:maternal_infant', label: 'Maternal & Child Health', description: 'Fetal monitors, incubators, pediatric' },
] as const;

export type CareSettingTagKey = typeof CARE_SETTING_TAGS[number]['key'];
export type ConditionTagKey = typeof CONDITION_TAGS[number]['key'];
