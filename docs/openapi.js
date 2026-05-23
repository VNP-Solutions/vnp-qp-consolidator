/**
 * OpenAPI 3.0 spec for the VNP QP Consolidation API.
 * Keep this in sync with the routes/controllers as new endpoints are added.
 */
module.exports = {
    openapi: '3.0.3',
    info: {
        title: 'VNP QP Consolidation API',
        version: '0.1.0',
        description: 'API for the QP data consolidation app.',
    },
    servers: [
        { url: '/api', description: 'Current host' },
    ],
    tags: [
        { name: 'Auth', description: 'Authentication endpoints' },
        { name: 'Users', description: 'User management endpoints' },
        { name: 'Files', description: 'QP file upload, parsing and listing' },
        { name: 'Dataset', description: 'Parsed QP transaction rows' },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
        schemas: {
            User: {
                type: 'object',
                properties: {
                    _id: { type: 'string', example: '66501a3f5d2c8e0012abcd34' },
                    email: { type: 'string', format: 'email', example: 'jane@example.com' },
                    first_name: { type: 'string', example: 'Jane' },
                    last_name: { type: 'string', example: 'Doe' },
                    created_at: { type: 'string', format: 'date-time' },
                    updated_at: { type: 'string', format: 'date-time' },
                },
            },
            CreateUserRequest: {
                type: 'object',
                required: ['email', 'first_name', 'last_name', 'password'],
                properties: {
                    email: { type: 'string', format: 'email', example: 'jane@example.com' },
                    first_name: { type: 'string', example: 'Jane' },
                    last_name: { type: 'string', example: 'Doe' },
                    password: { type: 'string', format: 'password', minLength: 8, example: 'sup3rsecret' },
                },
            },
            ListUsersResponse: {
                type: 'object',
                properties: {
                    items: { type: 'array', items: { $ref: '#/components/schemas/User' } },
                    total: { type: 'integer', example: 42 },
                    limit: { type: 'integer', example: 50 },
                    skip: { type: 'integer', example: 0 },
                },
            },
            LoginRequest: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', format: 'email', example: 'jane@example.com' },
                    password: { type: 'string', format: 'password', example: 'sup3rsecret' },
                },
            },
            LoginOtpSentResponse: {
                type: 'object',
                properties: {
                    message: { type: 'string', example: 'OTP sent to your email' },
                    email: { type: 'string', format: 'email', example: 'jane@example.com' },
                    expires_at: { type: 'string', format: 'date-time' },
                },
            },
            VerifyOtpRequest: {
                type: 'object',
                required: ['email', 'otp'],
                properties: {
                    email: { type: 'string', format: 'email', example: 'jane@example.com' },
                    otp: { type: 'string', example: '123456', minLength: 6, maxLength: 6 },
                },
            },
            AuthTokenResponse: {
                type: 'object',
                properties: {
                    userId: { type: 'string', example: '66501a3f5d2c8e0012abcd34' },
                    token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                    first_name: { type: 'string', example: 'Jane' },
                    last_name: { type: 'string', example: 'Doe' },
                    email: { type: 'string', format: 'email', example: 'jane@example.com' },
                },
            },
            ForgotPasswordRequest: {
                type: 'object',
                required: ['email'],
                properties: {
                    email: { type: 'string', format: 'email', example: 'jane@example.com' },
                },
            },
            ForgotPasswordResponse: {
                type: 'object',
                properties: {
                    message: {
                        type: 'string',
                        example: 'If an account exists for this email, a reset code has been sent.',
                    },
                    email: { type: 'string', format: 'email', example: 'jane@example.com' },
                },
            },
            VerifyForgotPasswordRequest: {
                type: 'object',
                required: ['email', 'otp'],
                properties: {
                    email: { type: 'string', format: 'email', example: 'jane@example.com' },
                    otp: { type: 'string', minLength: 6, maxLength: 6, example: '123456' },
                },
            },
            VerifyForgotPasswordResponse: {
                type: 'object',
                properties: {
                    reset_token: {
                        type: 'string',
                        description: 'Short-lived (15m) JWT used to authorize the reset call.',
                        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                    },
                },
            },
            ResetPasswordRequest: {
                type: 'object',
                required: ['reset_token', 'new_password'],
                properties: {
                    reset_token: {
                        type: 'string',
                        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                    },
                    new_password: {
                        type: 'string',
                        format: 'password',
                        minLength: 8,
                        example: 'newSecret123',
                    },
                },
            },
            ResetPasswordResponse: {
                type: 'object',
                properties: {
                    message: { type: 'string', example: 'Password has been reset successfully' },
                },
            },
            UploadedFile: {
                type: 'object',
                properties: {
                    _id: { type: 'string' },
                    original_name: { type: 'string', example: 'QP_Report_Q3.xlsx' },
                    size: { type: 'integer', example: 5234567 },
                    mime_type: { type: 'string', example: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
                    s3_key: { type: 'string' },
                    s3_url: { type: 'string' },
                    uploaded_by: {
                        oneOf: [
                            { type: 'string' },
                            { $ref: '#/components/schemas/User' },
                        ],
                    },
                    reported_date: {
                        type: 'string',
                        format: 'date-time',
                        nullable: true,
                        description:
                            'Parsed from the trailing YYYYMMDD in the filename (e.g. "..._20260519.xlsx"). Null if the pattern is absent.',
                    },
                    status: { type: 'string', enum: ['uploaded', 'processing', 'processed', 'failed', 'deleting'] },
                    delete_step: {
                        type: 'string',
                        enum: ['none', 'deleting_s3', 'deleting_data', 'deleting_file'],
                        description: 'Sub-step while status === "deleting". Use the polling endpoint to watch this advance through s3 → data → file. When the file is fully gone, GET returns 404.',
                    },
                    rows_total: { type: 'integer' },
                    rows_processed: { type: 'integer' },
                    rows_failed: { type: 'integer' },
                    parse_errors: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                row: { type: 'integer' },
                                message: { type: 'string' },
                            },
                        },
                    },
                    created_at: { type: 'string', format: 'date-time' },
                    updated_at: { type: 'string', format: 'date-time' },
                },
            },
            ListFilesResponse: {
                type: 'object',
                properties: {
                    items: { type: 'array', items: { $ref: '#/components/schemas/UploadedFile' } },
                    total: { type: 'integer' },
                    limit: { type: 'integer' },
                    skip: { type: 'integer' },
                },
            },
            QpFileData: {
                type: 'object',
                description: 'A single parsed QP transaction row. All Excel fields are stored snake_case; `file_id` links back to the source UploadedFile.',
                properties: {
                    _id: { type: 'string' },
                    file_id: { type: 'string' },
                    file_name: { type: 'string' },
                    file_url: { type: 'string' },
                    row_number: { type: 'integer' },
                    reported_date: { type: 'string', format: 'date-time', nullable: true },
                    mid: { type: 'string' },
                    dba: { type: 'string' },
                    transaction_date_time_local: { type: 'string' },
                    transaction_date_local: { type: 'string' },
                    transaction_id: { type: 'string' },
                    payment_type: { type: 'string' },
                    processor_id: { type: 'string' },
                    type: { type: 'string' },
                    account: { type: 'string' },
                    account_expiration: { type: 'string' },
                    order_id: { type: 'string' },
                    order_description: { type: 'string' },
                    time: { type: 'string' },
                    amount: { type: 'number' },
                    status: { type: 'string' },
                    response: { type: 'string' },
                    response_text: { type: 'string' },
                    avs_results: { type: 'string' },
                    csc_results: { type: 'string' },
                    auth_code: { type: 'string' },
                    batch_id: { type: 'string' },
                    first_name: { type: 'string' },
                    last_name: { type: 'string' },
                    company_name: { type: 'string' },
                    address_one: { type: 'string' },
                    address_two: { type: 'string' },
                    city: { type: 'string' },
                    state: { type: 'string' },
                    zip_code: { type: 'string' },
                    country: { type: 'string' },
                    email: { type: 'string' },
                    shipping_first_name: { type: 'string' },
                    shipping_last_name: { type: 'string' },
                    shipping_to_company_name: { type: 'string' },
                    shipping_to_address_one: { type: 'string' },
                    shipping_to_address_two: { type: 'string' },
                    shipping_to_city: { type: 'string' },
                    shipping_to_state: { type: 'string' },
                    shipping_to_postal_code: { type: 'string' },
                    shipping_to_country: { type: 'string' },
                    shipping_email: { type: 'string' },
                    phone_number: { type: 'string' },
                    fax: { type: 'string' },
                    user_name: { type: 'string' },
                    entry_method: { type: 'string' },
                    service_type: { type: 'string' },
                    descriptor_dba: { type: 'string' },
                    descriptor_phone_number: { type: 'string' },
                    authentication_result: { type: 'string' },
                    created_at: { type: 'string', format: 'date-time' },
                    updated_at: { type: 'string', format: 'date-time' },
                },
            },
            ListDatasetResponse: {
                type: 'object',
                properties: {
                    items: { type: 'array', items: { $ref: '#/components/schemas/QpFileData' } },
                    total: { type: 'integer' },
                    limit: { type: 'integer' },
                    skip: { type: 'integer' },
                },
            },
            Error: {
                type: 'object',
                properties: {
                    error: { type: 'string' },
                },
            },
        },
    },
    paths: {
        '/users': {
            post: {
                tags: ['Users'],
                summary: 'Create a new user',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/CreateUserRequest' },
                        },
                    },
                },
                responses: {
                    201: {
                        description: 'User created',
                        content: {
                            'application/json': { schema: { $ref: '#/components/schemas/User' } },
                        },
                    },
                    400: {
                        description: 'Validation error',
                        content: {
                            'application/json': { schema: { $ref: '#/components/schemas/Error' } },
                        },
                    },
                    409: {
                        description: 'Email already exists',
                        content: {
                            'application/json': { schema: { $ref: '#/components/schemas/Error' } },
                        },
                    },
                },
            },
            get: {
                tags: ['Users'],
                summary: 'List users',
                description: 'List users with optional case-insensitive email filter and sort by creation date.',
                parameters: [
                    {
                        name: 'email',
                        in: 'query',
                        description: 'Case-insensitive substring match against email',
                        schema: { type: 'string' },
                    },
                    {
                        name: 'sort',
                        in: 'query',
                        description: 'Sort by created_at',
                        schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
                    },
                    {
                        name: 'limit',
                        in: 'query',
                        schema: { type: 'integer', minimum: 1, maximum: 200, default: 50 },
                    },
                    {
                        name: 'skip',
                        in: 'query',
                        schema: { type: 'integer', minimum: 0, default: 0 },
                    },
                ],
                responses: {
                    200: {
                        description: 'Paginated list of users',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ListUsersResponse' },
                            },
                        },
                    },
                },
            },
        },
        '/users/{id}': {
            get: {
                tags: ['Users'],
                summary: 'Get a user by id (own profile only)',
                description:
                    'Requires a valid Bearer JWT. Returns the user document for the given id. The authenticated user can only fetch their own profile — fetching another user returns 403.',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' },
                        description: 'MongoDB ObjectId of the user',
                    },
                ],
                responses: {
                    200: {
                        description: 'User profile',
                        content: {
                            'application/json': { schema: { $ref: '#/components/schemas/User' } },
                        },
                    },
                    401: {
                        description: 'Missing/invalid token',
                        content: {
                            'application/json': { schema: { $ref: '#/components/schemas/Error' } },
                        },
                    },
                    403: {
                        description: 'Trying to access another user',
                        content: {
                            'application/json': { schema: { $ref: '#/components/schemas/Error' } },
                        },
                    },
                    404: {
                        description: 'User not found',
                        content: {
                            'application/json': { schema: { $ref: '#/components/schemas/Error' } },
                        },
                    },
                },
            },
        },
        '/auth/login': {
            post: {
                tags: ['Auth'],
                summary: 'Step 1: Verify credentials and email an OTP',
                description:
                    'Verifies email + password, generates a 6-digit OTP, emails it to the user, and stores a hashed copy with a 10-minute expiry. Call /auth/verify with the OTP to receive a JWT.',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/LoginRequest' },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'OTP emailed to the user',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/LoginOtpSentResponse' },
                            },
                        },
                    },
                    400: {
                        description: 'Missing email or password',
                        content: {
                            'application/json': { schema: { $ref: '#/components/schemas/Error' } },
                        },
                    },
                    401: {
                        description: 'Invalid credentials',
                        content: {
                            'application/json': { schema: { $ref: '#/components/schemas/Error' } },
                        },
                    },
                },
            },
        },
        '/auth/verify': {
            post: {
                tags: ['Auth'],
                summary: 'Step 2: Verify the OTP and receive a JWT',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/VerifyOtpRequest' },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Authenticated successfully',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/AuthTokenResponse' },
                            },
                        },
                    },
                    400: {
                        description: 'Missing email or otp',
                        content: {
                            'application/json': { schema: { $ref: '#/components/schemas/Error' } },
                        },
                    },
                    401: {
                        description: 'Invalid or expired code',
                        content: {
                            'application/json': { schema: { $ref: '#/components/schemas/Error' } },
                        },
                    },
                },
            },
        },
        '/auth/forgot-password': {
            post: {
                tags: ['Auth'],
                summary: 'Step 1: Request a password reset OTP via email',
                description:
                    'Always returns 200 with a generic message regardless of whether the email exists, to avoid leaking which emails are registered.',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ForgotPasswordRequest' },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Reset code sent (or quietly ignored for unknown email)',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ForgotPasswordResponse' },
                            },
                        },
                    },
                    400: {
                        description: 'Missing email',
                        content: {
                            'application/json': { schema: { $ref: '#/components/schemas/Error' } },
                        },
                    },
                },
            },
        },
        '/auth/forgot-password/verify': {
            post: {
                tags: ['Auth'],
                summary: 'Step 2: Verify the reset OTP and receive a reset_token',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/VerifyForgotPasswordRequest' },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'OTP verified — pass the reset_token to the /reset endpoint',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/VerifyForgotPasswordResponse' },
                            },
                        },
                    },
                    400: {
                        description: 'Missing email or otp',
                        content: {
                            'application/json': { schema: { $ref: '#/components/schemas/Error' } },
                        },
                    },
                    401: {
                        description: 'Invalid or expired code',
                        content: {
                            'application/json': { schema: { $ref: '#/components/schemas/Error' } },
                        },
                    },
                },
            },
        },
        '/dataset': {
            get: {
                tags: ['Dataset'],
                summary: 'List parsed QP transaction rows for the authenticated user',
                description:
                    'Returns all QpFileData rows belonging to files this user owns. Search across `order_id` (reservation id), `mid`, and `dba` via the `q` parameter.',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 200, default: 50 } },
                    { name: 'skip', in: 'query', schema: { type: 'integer', minimum: 0, default: 0 } },
                    {
                        name: 'q',
                        in: 'query',
                        description: 'Case-insensitive substring match against `order_id`, `mid`, and `dba`. Regex chars are escaped.',
                        schema: { type: 'string' },
                    },
                ],
                responses: {
                    200: {
                        description: 'Paginated rows',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ListDatasetResponse' },
                            },
                        },
                    },
                    401: {
                        description: 'Missing/invalid token',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
                    },
                },
            },
        },
        '/files': {
            post: {
                tags: ['Files'],
                summary: 'Upload a QP report Excel file to S3',
                description:
                    'Multipart upload of an `.xlsx` / `.xls` / `.csv` file. The server validates the QP header row, uploads the file to S3, and creates an UploadedFile record. To parse rows into QpFileData, call `POST /files/{id}/parse` after this returns.',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                properties: {
                                    file: { type: 'string', format: 'binary' },
                                },
                                required: ['file'],
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: 'File uploaded',
                        content: {
                            'application/json': { schema: { $ref: '#/components/schemas/UploadedFile' } },
                        },
                    },
                    400: {
                        description: 'No file, or invalid QP headers',
                        content: {
                            'application/json': { schema: { $ref: '#/components/schemas/Error' } },
                        },
                    },
                    401: {
                        description: 'Missing/invalid token',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
                    },
                },
            },
            get: {
                tags: ['Files'],
                summary: 'List the authenticated user\'s uploaded files',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 200, default: 50 } },
                    { name: 'skip', in: 'query', schema: { type: 'integer', minimum: 0, default: 0 } },
                    {
                        name: 'q',
                        in: 'query',
                        description: 'Case-insensitive substring match against `original_name`. Special regex characters are escaped, so `(` / `*` / etc. are literal.',
                        schema: { type: 'string' },
                    },
                ],
                responses: {
                    200: {
                        description: 'Paginated list of files',
                        content: {
                            'application/json': { schema: { $ref: '#/components/schemas/ListFilesResponse' } },
                        },
                    },
                },
            },
        },
        '/files/{id}': {
            get: {
                tags: ['Files'],
                summary: 'Get a single file (use to poll parse or delete progress)',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                ],
                responses: {
                    200: {
                        description: 'File',
                        content: {
                            'application/json': { schema: { $ref: '#/components/schemas/UploadedFile' } },
                        },
                    },
                    403: { description: 'Forbidden (not owner)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                    404: { description: 'File not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                },
            },
            delete: {
                tags: ['Files'],
                summary: 'Delete a file (S3 object + parsed data rows + the record itself)',
                description:
                    'Returns 202 immediately. Deletion runs in the background through three steps: `deleting_s3` → `deleting_data` → `deleting_file`. Poll `GET /files/{id}` to follow `delete_step`; once the file is fully gone, polling returns 404 — that\'s the success signal.',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                ],
                responses: {
                    202: {
                        description: 'Deletion started',
                        content: {
                            'application/json': { schema: { $ref: '#/components/schemas/UploadedFile' } },
                        },
                    },
                    403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                    404: { description: 'File not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                },
            },
        },
        '/files/{id}/parse': {
            post: {
                tags: ['Files'],
                summary: 'Kick off async parsing of a previously-uploaded file',
                description:
                    'Returns 202 immediately. Parsing runs in the background, downloading the file from S3 and inserting one QpFileData document per row. Poll `GET /files/{id}` to watch `rows_processed` / `rows_total` / `status` until `status === "processed"`.',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                ],
                responses: {
                    202: {
                        description: 'Parsing started',
                        content: {
                            'application/json': { schema: { $ref: '#/components/schemas/UploadedFile' } },
                        },
                    },
                    403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                    404: { description: 'File not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                },
            },
        },
        '/auth/forgot-password/reset': {
            post: {
                tags: ['Auth'],
                summary: 'Step 3: Set a new password using the reset_token',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ResetPasswordRequest' },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Password reset successful',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ResetPasswordResponse' },
                            },
                        },
                    },
                    400: {
                        description: 'Missing fields or password too short',
                        content: {
                            'application/json': { schema: { $ref: '#/components/schemas/Error' } },
                        },
                    },
                    401: {
                        description: 'Invalid or expired reset token',
                        content: {
                            'application/json': { schema: { $ref: '#/components/schemas/Error' } },
                        },
                    },
                },
            },
        },
    },
};