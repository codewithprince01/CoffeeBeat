package com.coffeebeat;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main Spring Boot application class for Coffee Beat Management System
 */
@SpringBootApplication
@EnableAsync
@EnableScheduling
public class CoffeeBeatApplication {

    public static void main(String[] args) {
        SpringApplication.run(CoffeeBeatApplication.class, args);
    }

}
