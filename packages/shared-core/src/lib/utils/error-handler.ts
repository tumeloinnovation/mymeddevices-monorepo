export enum ErrorCode {
    AUTH_FAILED = 'AUTH_FAILED',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    NOT_FOUND = 'NOT_FOUND',
    PAYMENT_FAILED = 'PAYMENT_FAILED',
    EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
    INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export class AppError extends Error {
    constructor(
        public code: ErrorCode,
        message: string,
        public statusCode: number = 500,
        public context?: Record<string, unknown>,
        public userMessage?: string // Message safe to show to user
    ) {
        super(message);
        this.name = 'AppError';
    }
}

export function handleError(error: unknown, context?: Record<string, unknown>) {
    // 1. Normalize error to AppError
    let appError: AppError;

    if (error instanceof AppError) {
        appError = error;
        // Merge context
        if (context) {
            appError.context = { ...appError.context, ...context };
        }
    } else if (error instanceof Error) {
        appError = new AppError(
            ErrorCode.INTERNAL_ERROR,
            error.message,
            500,
            context
        );
        appError.stack = error.stack;
    } else {
        appError = new AppError(
            ErrorCode.INTERNAL_ERROR,
            String(error),
            500,
            context
        );
    }

    // 3. Log to console (structured)
    console.error(JSON.stringify({
        level: 'error',
        code: appError.code,
        message: appError.message,
        context: appError.context,
        stack: appError.stack,
    }));

    return appError;
}
