package com.coffeebeat.config;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.AbstractMongoClientConfiguration;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@Configuration
@EnableMongoRepositories(basePackages = "com.coffeebeat.repository")
@EnableMongoAuditing
public class MongoDBConfig extends AbstractMongoClientConfiguration {

    private static final Logger logger = LoggerFactory.getLogger(MongoDBConfig.class);

    @Value("${spring.data.mongodb.uri}")
    private String mongoUri;

    @Value("${spring.data.mongodb.database}")
    private String databaseName;

    @Override
    protected String getDatabaseName() {
        return databaseName;
    }

    @Bean
    @Override
    public MongoClient mongoClient() {
        try {
            logger.info("Connecting to MongoDB...");
            ConnectionString connectionString = new ConnectionString(mongoUri);

            MongoClientSettings settings = MongoClientSettings.builder()
                    .applyConnectionString(connectionString)
                    .build();

            MongoClient client = MongoClients.create(settings);

            client.listDatabaseNames().first();
            logger.info("✅ Connected to MongoDB Successfully");

            return client;
        } catch (Exception e) {
            logger.error("❌ MongoDB Connection Failed: {}", e.getMessage());
            throw e;
        }
    }

    @Bean
    public MongoTemplate mongoTemplate() {
        return new MongoTemplate(mongoClient(), getDatabaseName());
    }

    @Override
    protected boolean autoIndexCreation() {
        return true;
    }
}
