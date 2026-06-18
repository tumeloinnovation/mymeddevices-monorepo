export interface PasswordRequirement {
    id: string;
    label: string;
    regex: RegExp;
}

export const getPasswordRequirements = (): PasswordRequirement[] => [
    { id: 'length', label: 'At least 8 characters', regex: /.{8,}/ },
    { id: 'uppercase', label: 'At least one uppercase letter', regex: /[A-Z]/ },
    { id: 'lowercase', label: 'At least one lowercase letter', regex: /[a-z]/ },
    { id: 'number', label: 'At least one number', regex: /[0-9]/ },
    { id: 'special', label: 'At least one special character', regex: /[^A-Za-z0-9]/ },
];

export interface PasswordValidationResult {
    valid: boolean;
    errors: string[];
}

export const validatePassword = (password: string): PasswordValidationResult => {
    const requirements = getPasswordRequirements();
    const errors: string[] = [];
    
    requirements.forEach(req => {
        if (!req.regex.test(password)) {
            errors.push(req.label);
        }
    });
    
    return {
        valid: errors.length === 0,
        errors
    };
};
