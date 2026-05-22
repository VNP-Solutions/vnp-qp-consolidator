const mongoose = require('mongoose');

const parseErrorSchema = new mongoose.Schema(
    {
        row: Number,
        message: String,
    },
    { _id: false }
);

const uploadedFileSchema = new mongoose.Schema(
    {
        original_name: { type: String, required: true },
        size: Number,
        mime_type: String,
        s3_key: { type: String, required: true },
        s3_url: { type: String, required: true },
        uploaded_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        reported_date: { type: Date, index: true },
        status: {
            type: String,
            enum: ['uploaded', 'processing', 'processed', 'failed', 'deleting'],
            default: 'uploaded',
            index: true,
        },
        delete_step: {
            type: String,
            enum: ['none', 'deleting_s3', 'deleting_data', 'deleting_file'],
            default: 'none',
        },
        rows_total: { type: Number, default: 0 },
        rows_processed: { type: Number, default: 0 },
        rows_failed: { type: Number, default: 0 },
        parse_errors: { type: [parseErrorSchema], default: [] },
    },
    { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('UploadedFile', uploadedFileSchema);