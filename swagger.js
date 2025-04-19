const swaggerAutogen = require("swagger-autogen")();
const outputFile = "./swagger_output.json"; // Файл, куда сохранится документация
const endpointsFiles = ["./routes/api/*.js"]; // Пути к файлам с маршрутами
swaggerAutogen(outputFile, endpointsFiles);
