# Use official OpenJDK 17 runtime as a parent image
FROM openjdk:17-jdk-slim

# Set the working directory in the container
WORKDIR /app

# Copy the Maven pom.xml file
COPY pom.xml .

# Copy Maven wrapper and Maven configuration
COPY .mvn .mvn
COPY mvnw .

# Download Maven dependencies
RUN ./mvnw dependency:go-offline -B

# Copy the source code
COPY src ./src

# Build the application
RUN ./mvnw clean package -DskipTests

# Make port 8080 available to the world outside this container
EXPOSE 8081

# Add a wait script to wait for MongoDB
ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.9.0/wait /wait
RUN chmod +x /wait

# Run the application
CMD /wait && java -jar target/coffee-beat-0.0.1-SNAPSHOT.jar
