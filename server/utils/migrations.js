const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const { AppError } = require('../middleware/errorHandler');

/**
 * Database Migration Utility
 * Free migration system for MongoDB schema changes
 */

class MigrationManager {
  constructor() {
    this.migrationsPath = path.join(__dirname, '../migrations');
    this.migrationCollection = 'migrations';
  }

  /**
   * Initialize migration system
   */
  async initialize() {
    try {
      // Ensure migrations directory exists
      await fs.mkdir(this.migrationsPath, { recursive: true });
      
      // Create migrations collection if it doesn't exist
      const db = mongoose.connection.db;
      const collections = await db.listCollections({ name: this.migrationCollection }).toArray();
      
      if (collections.length === 0) {
        await db.createCollection(this.migrationCollection);
        console.log('Migration collection created');
      }
      
      return true;
    } catch (error) {
      console.error('Migration initialization error:', error);
      throw new AppError('Failed to initialize migration system', 500);
    }
  }

  /**
   * Create a new migration file
   */
  async createMigration(name, description = '') {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `${timestamp}_${name.replace(/\s+/g, '_').toLowerCase()}.js`;
      const filepath = path.join(this.migrationsPath, filename);
      
      const template = `/**
 * Migration: ${name}
 * Description: ${description}
 * Created: ${new Date().toISOString()}
 */

const mongoose = require('mongoose');

module.exports = {
  // Migration version (timestamp)
  version: '${timestamp}',
  
  // Migration name
  name: '${name}',
  
  // Migration description
  description: '${description}',
  
  /**
   * Run the migration (forward)
   */
  async up() {
    const db = mongoose.connection.db;
    
    try {
      // Add your migration logic here
      console.log('Running migration: ${name}');
      
      // Example: Create new index
      // await db.collection('users').createIndex({ email: 1 }, { unique: true });
      
      // Example: Update documents
      // await db.collection('users').updateMany(
      //   { role: { $exists: false } },
      //   { $set: { role: 'user' } }
      // );
      
      // Example: Add new field with default value
      // await db.collection('exams').updateMany(
      //   { newField: { $exists: false } },
      //   { $set: { newField: 'defaultValue' } }
      // );
      
      console.log('Migration ${name} completed successfully');
      return true;
    } catch (error) {
      console.error('Migration ${name} failed:', error);
      throw error;
    }
  },
  
  /**
   * Rollback the migration (backward)
   */
  async down() {
    const db = mongoose.connection.db;
    
    try {
      // Add your rollback logic here
      console.log('Rolling back migration: ${name}');
      
      // Example: Drop index
      // await db.collection('users').dropIndex({ email: 1 });
      
      // Example: Remove field
      // await db.collection('users').updateMany(
      //   {},
      //   { $unset: { role: '' } }
      // );
      
      console.log('Migration ${name} rolled back successfully');
      return true;
    } catch (error) {
      console.error('Migration ${name} rollback failed:', error);
      throw error;
    }
  }
};
`;
      
      await fs.writeFile(filepath, template);
      console.log(`Migration created: ${filename}`);
      return filename;
    } catch (error) {
      console.error('Failed to create migration:', error);
      throw new AppError('Failed to create migration file', 500);
    }
  }

  /**
   * Get all migration files
   */
  async getMigrationFiles() {
    try {
      const files = await fs.readdir(this.migrationsPath);
      return files
        .filter(file => file.endsWith('.js'))
        .sort(); // Sort by timestamp (filename)
    } catch (error) {
      console.error('Failed to read migration files:', error);
      return [];
    }
  }

  /**
   * Get executed migrations from database
   */
  async getExecutedMigrations() {
    try {
      const db = mongoose.connection.db;
      const migrations = await db.collection(this.migrationCollection)
        .find({}, { projection: { version: 1, name: 1, executedAt: 1 } })
        .sort({ executedAt: 1 })
        .toArray();
      
      return migrations.map(m => m.version);
    } catch (error) {
      console.error('Failed to get executed migrations:', error);
      return [];
    }
  }

  /**
   * Load migration module
   */
  async loadMigration(filename) {
    try {
      const filepath = path.join(this.migrationsPath, filename);
      delete require.cache[require.resolve(filepath)];
      return require(filepath);
    } catch (error) {
      console.error(`Failed to load migration ${filename}:`, error);
      throw new AppError(`Failed to load migration: ${filename}`, 500);
    }
  }

  /**
   * Record migration execution
   */
  async recordMigration(migration, direction = 'up') {
    try {
      const db = mongoose.connection.db;
      
      if (direction === 'up') {
        await db.collection(this.migrationCollection).insertOne({
          version: migration.version,
          name: migration.name,
          description: migration.description,
          executedAt: new Date(),
          direction: 'up'
        });
      } else {
        await db.collection(this.migrationCollection).deleteOne({
          version: migration.version
        });
      }
    } catch (error) {
      console.error('Failed to record migration:', error);
      throw new AppError('Failed to record migration execution', 500);
    }
  }

  /**
   * Run pending migrations
   */
  async migrate() {
    try {
      await this.initialize();
      
      const migrationFiles = await this.getMigrationFiles();
      const executedMigrations = await this.getExecutedMigrations();
      
      const pendingMigrations = migrationFiles.filter(file => {
        const version = file.split('_')[0];
        return !executedMigrations.includes(version);
      });
      
      if (pendingMigrations.length === 0) {
        console.log('No pending migrations');
        return { executed: 0, migrations: [] };
      }
      
      console.log(`Found ${pendingMigrations.length} pending migrations`);
      const executedList = [];
      
      for (const filename of pendingMigrations) {
        try {
          console.log(`Executing migration: ${filename}`);
          
          const migration = await this.loadMigration(filename);
          await migration.up();
          await this.recordMigration(migration, 'up');
          
          executedList.push({
            filename,
            name: migration.name,
            version: migration.version
          });
          
          console.log(`✓ Migration ${filename} completed`);
        } catch (error) {
          console.error(`✗ Migration ${filename} failed:`, error);
          throw new AppError(`Migration failed: ${filename}`, 500);
        }
      }
      
      console.log(`Successfully executed ${executedList.length} migrations`);
      return { executed: executedList.length, migrations: executedList };
    } catch (error) {
      console.error('Migration execution failed:', error);
      throw error;
    }
  }

  /**
   * Rollback last migration
   */
  async rollback(steps = 1) {
    try {
      await this.initialize();
      
      const db = mongoose.connection.db;
      const executedMigrations = await db.collection(this.migrationCollection)
        .find({}, { projection: { version: 1, name: 1 } })
        .sort({ executedAt: -1 })
        .limit(steps)
        .toArray();
      
      if (executedMigrations.length === 0) {
        console.log('No migrations to rollback');
        return { rolledBack: 0, migrations: [] };
      }
      
      console.log(`Rolling back ${executedMigrations.length} migrations`);
      const rolledBackList = [];
      
      for (const migrationRecord of executedMigrations) {
        try {
          // Find the migration file
          const migrationFiles = await this.getMigrationFiles();
          const filename = migrationFiles.find(file => 
            file.startsWith(migrationRecord.version)
          );
          
          if (!filename) {
            console.warn(`Migration file not found for version: ${migrationRecord.version}`);
            continue;
          }
          
          console.log(`Rolling back migration: ${filename}`);
          
          const migration = await this.loadMigration(filename);
          await migration.down();
          await this.recordMigration(migration, 'down');
          
          rolledBackList.push({
            filename,
            name: migration.name,
            version: migration.version
          });
          
          console.log(`✓ Migration ${filename} rolled back`);
        } catch (error) {
          console.error(`✗ Rollback failed for ${migrationRecord.version}:`, error);
          throw new AppError(`Rollback failed: ${migrationRecord.version}`, 500);
        }
      }
      
      console.log(`Successfully rolled back ${rolledBackList.length} migrations`);
      return { rolledBack: rolledBackList.length, migrations: rolledBackList };
    } catch (error) {
      console.error('Rollback failed:', error);
      throw error;
    }
  }

  /**
   * Get migration status
   */
  async getStatus() {
    try {
      await this.initialize();
      
      const migrationFiles = await this.getMigrationFiles();
      const executedMigrations = await this.getExecutedMigrations();
      
      const status = migrationFiles.map(file => {
        const version = file.split('_')[0];
        const isExecuted = executedMigrations.includes(version);
        
        return {
          filename: file,
          version,
          executed: isExecuted,
          status: isExecuted ? 'executed' : 'pending'
        };
      });
      
      const pendingCount = status.filter(s => !s.executed).length;
      const executedCount = status.filter(s => s.executed).length;
      
      return {
        total: status.length,
        executed: executedCount,
        pending: pendingCount,
        migrations: status
      };
    } catch (error) {
      console.error('Failed to get migration status:', error);
      throw new AppError('Failed to get migration status', 500);
    }
  }

  /**
   * Reset all migrations (dangerous - use with caution)
   */
  async reset() {
    try {
      const db = mongoose.connection.db;
      await db.collection(this.migrationCollection).deleteMany({});
      console.log('All migration records cleared');
      return true;
    } catch (error) {
      console.error('Failed to reset migrations:', error);
      throw new AppError('Failed to reset migrations', 500);
    }
  }
}

/**
 * Data seeding utilities
 */
class DataSeeder {
  /**
   * Seed initial admin user
   */
  static async seedAdminUser() {
    try {
      const User = require('../models/User');
      const bcrypt = require('bcryptjs');
      
      const adminExists = await User.findOne({ role: 'admin' });
      if (adminExists) {
        console.log('Admin user already exists');
        return adminExists;
      }
      
      const hashedPassword = await bcrypt.hash('Admin@123456', 12);
      
      const adminUser = new User({
        name: 'System Administrator',
        email: 'admin@interview-master.com',
        password: hashedPassword,
        role: 'admin',
        isVerified: true,
        profile: {
          bio: 'System Administrator Account',
          skills: ['System Administration', 'User Management'],
          experience: 'Senior',
          location: 'System'
        }
      });
      
      await adminUser.save();
      console.log('Admin user created successfully');
      return adminUser;
    } catch (error) {
      // Handle duplicate key error gracefully
      if (error.code === 11000 || error.message.includes('E11000')) {
        console.log('Admin user already exists (duplicate key detected)');
        // Try to find and return the existing admin user
        const User = require('../models/User');
        const existingAdmin = await User.findOne({ email: 'admin@interview-master.com' });
        return existingAdmin;
      }
      console.error('Failed to seed admin user:', error);
      throw error;
    }
  }

  /**
   * Seed sample exam categories
   */
  static async seedExamCategories() {
    try {
      const categories = [
        'JavaScript', 'Python', 'Java', 'C++', 'C#', 'PHP',
        'Ruby', 'Go', 'Rust', 'TypeScript', 'React', 'Node.js',
        'Algorithms', 'Data Structures', 'System Design', 'Databases'
      ];
      
      console.log('Exam categories seeded:', categories.join(', '));
      return categories;
    } catch (error) {
      console.error('Failed to seed exam categories:', error);
      throw error;
    }
  }

  /**
   * Seed sample questions
   */
  static async seedSampleQuestions() {
    try {
      // This would typically load from a JSON file or external source
      const sampleQuestions = [
        {
          type: 'mcq',
          category: 'javascript',
          difficulty: 'easy',
          question: 'What is the correct way to declare a variable in JavaScript?',
          options: ['var x = 5;', 'variable x = 5;', 'v x = 5;', 'declare x = 5;'],
          correctAnswer: 0,
          points: 5,
          timeLimit: 60
        },
        {
          type: 'coding',
          category: 'algorithms',
          difficulty: 'medium',
          question: 'Write a function to reverse a string',
          codeTemplate: 'function reverseString(str) {\n  // Your code here\n}',
          testCases: [
            { input: 'hello', expectedOutput: 'olleh' },
            { input: 'world', expectedOutput: 'dlrow' }
          ],
          points: 15,
          timeLimit: 300
        }
      ];
      
      console.log(`Sample questions prepared: ${sampleQuestions.length} questions`);
      return sampleQuestions;
    } catch (error) {
      console.error('Failed to seed sample questions:', error);
      throw error;
    }
  }
}

module.exports = {
  MigrationManager,
  DataSeeder
};