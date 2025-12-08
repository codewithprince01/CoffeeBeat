package com.coffeebeat.service;

import com.coffeebeat.model.Order;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void notifyOrderCreated(Order order) {
        logger.info("Broadcasting new order: {}", order.getId());
        messagingTemplate.convertAndSend("/topic/orders", order);
    }

    public void notifyOrderStatusUpdate(Order order) {
        logger.info("Broadcasting order update: {} -> {}", order.getId(), order.getStatus());
        messagingTemplate.convertAndSend("/topic/orders", order);

        // precise updates for specific order listeners
        messagingTemplate.convertAndSend("/topic/orders/" + order.getId(), order);
    }

    public void notifyTableUpdate(String tableNumber) {
        // Potential future use for live table status
        messagingTemplate.convertAndSend("/topic/tables", tableNumber);
    }
}
