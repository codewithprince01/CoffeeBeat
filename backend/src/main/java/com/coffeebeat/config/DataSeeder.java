package com.coffeebeat.config;

import com.coffeebeat.model.*;
import com.coffeebeat.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

/**
 * Data seeder for initial database population
 * 
 * This component runs on application startup and creates initial data
 * including admin user, sample products, and invite tokens.
 */
@Component
public class DataSeeder implements CommandLineRunner {
    
    private static final Logger logger = LoggerFactory.getLogger(DataSeeder.class);
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private InviteTokenRepository inviteTokenRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Override
    public void run(String... args) throws Exception {
        logger.info("Starting data seeding...");
        
        // Check if admin user exists
        if (!userRepository.existsByEmail("admin@coffee.test")) {
            createAdminUser();
        }
        
        // Check if chef user exists
        if (!userRepository.existsByEmail("chef@coffee.test")) {
            createChefUser();
        }
        
        // Check if waiter user exists
        if (!userRepository.existsByEmail("waiter@coffee.test")) {
            createWaiterUser();
        }
        
        // Check if customer user exists
        if (!userRepository.existsByEmail("customer@coffee.test")) {
            createCustomerUser();
        }
        
        // Check if products exist
        if (productRepository.count() == 0) {
            createSampleProducts();
        }
        
        // Create sample invite tokens for staff
        createSampleInviteTokens();
        
        logger.info("Data seeding completed successfully!");
    }
    
    /**
     * Create admin user
     */
    private void createAdminUser() {
        logger.info("Creating admin user...");
        
        User admin = new User(
            "Admin User",
            "admin@coffee.test",
            passwordEncoder.encode("Password123!"),
            "ROLE_ADMIN"
        );
        admin.setActive(true);
        
        userRepository.save(admin);
        logger.info("Admin user created: admin@coffee.test / Password123!");
    }
    
    /**
     * Create chef user
     */
    private void createChefUser() {
        logger.info("Creating chef user...");
        
        User chef = new User(
            "Chef User",
            "chef@coffee.test",
            passwordEncoder.encode("Password123!"),
            "ROLE_CHEF"
        );
        chef.setActive(true);
        
        userRepository.save(chef);
        logger.info("Chef user created: chef@coffee.test / Password123!");
    }
    
    /**
     * Create waiter user
     */
    private void createWaiterUser() {
        logger.info("Creating waiter user...");
        
        User waiter = new User(
            "Waiter User",
            "waiter@coffee.test",
            passwordEncoder.encode("Password123!"),
            "ROLE_WAITER"
        );
        waiter.setActive(true);
        
        userRepository.save(waiter);
        logger.info("Waiter user created: waiter@coffee.test / Password123!");
    }
    
    /**
     * Create customer user
     */
    private void createCustomerUser() {
        logger.info("Creating customer user...");
        
        User customer = new User(
            "Customer User",
            "customer@coffee.test",
            passwordEncoder.encode("Password123!"),
            "ROLE_CUSTOMER"
        );
        customer.setActive(true);
        
        userRepository.save(customer);
        logger.info("Customer user created: customer@coffee.test / Password123!");
    }
    
    /**
     * Create sample products
     */
    private void createSampleProducts() {
        logger.info("Creating sample products...");
        
        List<Product> products = Arrays.asList(
            // Coffee
            new Product("Espresso", "espresso", 2.50, 100, 
                "Strong and bold espresso shot", "COFFEE"),
            new Product("Cappuccino", "cappuccino", 4.00, 100, 
                "Classic Italian cappuccino with foam", "COFFEE"),
            new Product("Latte", "latte", 4.50, 100, 
                "Smooth and creamy latte", "COFFEE"),
            new Product("Americano", "americano", 3.00, 100, 
                "Diluted espresso with hot water", "COFFEE"),
            new Product("Mocha", "mocha", 5.00, 100, 
                "Chocolate espresso with milk", "COFFEE"),
            new Product("Cold Brew", "cold-brew", 4.00, 100, 
                "Slow-steeped cold coffee", "COFFEE"),
            
            // Tea
            new Product("Green Tea", "green-tea", 3.00, 100, 
                "Fresh green tea leaves", "TEA"),
            new Product("Black Tea", "black-tea", 2.50, 100, 
                "Classic black tea", "TEA"),
            new Product("Chai Latte", "chai-latte", 4.50, 100, 
                "Spiced Indian tea with milk", "TEA"),
            new Product("Herbal Tea", "herbal-tea", 3.50, 100, 
                "Caffeine-free herbal infusion", "TEA"),
            
            // Food
            new Product("Croissant", "croissant", 3.00, 50, 
                "Buttery French croissant", "FOOD"),
            new Product("Bagel", "bagel", 2.50, 50, 
                "Fresh baked bagel", "FOOD"),
            new Product("Sandwich", "sandwich", 7.00, 30, 
                "Club sandwich with fries", "FOOD"),
            new Product("Salad", "salad", 6.00, 30, 
                "Fresh garden salad", "FOOD"),
            new Product("Cake Slice", "cake-slice", 4.50, 20, 
                "Daily special cake slice", "FOOD"),
            new Product("Muffin", "muffin", 3.00, 40, 
                "Fresh baked muffin", "FOOD"),
            
            // Pastries
            new Product("Danish", "danish", 3.50, 25, 
                "Sweet fruit danish", "PASTRY"),
            new Product("Donut", "donut", 2.00, 50, 
                "Glazed donut", "PASTRY"),
            new Product("Cookie", "cookie", 1.50, 60, 
                "Chocolate chip cookie", "PASTRY")
        );
        
        productRepository.saveAll(products);
        logger.info("Created {} sample products", products.size());
    }
    
    /**
     * Create sample invite tokens for staff
     */
    private void createSampleInviteTokens() {
        logger.info("Creating sample invite tokens...");
        
        // Check if tokens already exist
        if (inviteTokenRepository.count() > 0) {
            logger.info("Invite tokens already exist, skipping creation");
            return;
        }
        
        List<InviteToken> tokens = Arrays.asList(
            InviteToken.create("chef-invite-001", "chef@coffee.test", "ROLE_CHEF"),
            InviteToken.create("chef-invite-002", "headchef@coffee.test", "ROLE_CHEF"),
            InviteToken.create("waiter-invite-001", "waiter@coffee.test", "ROLE_WAITER"),
            InviteToken.create("waiter-invite-002", "waiter2@coffee.test", "ROLE_WAITER"),
            InviteToken.create("waiter-invite-003", "waiter3@coffee.test", "ROLE_WAITER")
        );
        
        inviteTokenRepository.saveAll(tokens);
        logger.info("Created {} sample invite tokens", tokens.size());
        
        // Log the tokens for testing purposes
        logger.info("Sample invite tokens for testing:");
        tokens.forEach(token -> {
            logger.info("- {}: {} (Role: {}, Email: {})", 
                token.getToken(), token.getRole(), token.getEmail());
        });
    }
}
