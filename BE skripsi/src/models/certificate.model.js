const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Certificate = sequelize.define('Certificate', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    templateId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Templates',
            key: 'id'
        }
    },
    recipientName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    certificateTitle: {
        type: DataTypes.STRING,
        allowNull: false
    },
    issueDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    expiryDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    filename: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('active', 'revoked'),
        defaultValue: 'active'
    }
});

module.exports = Certificate; 