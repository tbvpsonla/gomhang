// All configurations will extend these options
// ============================================
module.exports = {
    // Should we populate the DB with sample data?
    seedDB: true,

    // MongoDB connection options
    mongo: {
        options: {
            db: {
                safe: true
            }
        },
        uri: 'mongodb://localhost/aviva-dev'
    }
};
