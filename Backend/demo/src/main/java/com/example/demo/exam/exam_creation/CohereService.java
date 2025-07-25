package com.example.demo.exam.exam_creation;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class CohereService {

    private static final String COHERE_API_URL = "https://api.cohere.com/v2/chat";
    
    @Value("${cohere.api.key}")
    private String COHERE_API_KEY;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    public List<Question> generateQuestions(String subject, String topic, String[] specificAreas, int numberOfQuestions, String difficulty) {
        try {
            String difficultyLevel = (difficulty != null && !difficulty.isEmpty()) ? difficulty : "medium";
            
            String areasDetail = "";
            if (specificAreas != null && specificAreas.length > 0) {
                areasDetail = " focusing specifically on: " + String.join(", ", specificAreas);
            }
            
            String prompt = String.format(
                "Create %d multiple-choice questions about %s in the subject of %s%s with %s difficulty level. " +
                "Each question should have exactly 4 options (A, B, C, D) with one correct answer. " +
                "Format each question in JSON like this: " +
                "{ " +
                "\"question\": \"What is the question?\", " +
                "\"optionA\": \"First option\", " +
                "\"optionB\": \"Second option\", " +
                "\"optionC\": \"Third option\", " +
                "\"optionD\": \"Fourth option\", " +
                "\"correctAns\": \"A\" " +
                "} " +
                "Provide an array of %d question objects in this format. " +
                "The correct answer should be one of: A, B, C, or D. " +
                "Do not include backticks, code blocks, or any markdown formatting in your response.",
                numberOfQuestions, topic, subject, areasDetail, difficultyLevel, numberOfQuestions
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + COHERE_API_KEY);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("stream", false);
            requestBody.put("model", "command-a-03-2025");
            
            Map<String, Object> message = new HashMap<>();
            message.put("role", "user");
            message.put("content", prompt);
            
            requestBody.put("messages", List.of(message));

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<String> response = restTemplate.exchange(
                COHERE_API_URL, 
                HttpMethod.POST, 
                entity, 
                String.class
            );
            
            String responseBody = response.getBody();
            Map<String, Object> responseMap = objectMapper.readValue(responseBody, Map.class);
            
            String content = "";
            if (responseMap.containsKey("message")) {
                Map<String, Object> messageObj = (Map<String, Object>) responseMap.get("message");
                if (messageObj.containsKey("content")) {
                    List<Map<String, Object>> contentList = (List<Map<String, Object>>) messageObj.get("content");
                    if (!contentList.isEmpty()) {
                        content = (String) contentList.get(0).get("text");
                    }
                }
            }
            
            content = cleanContent(content);
            
            Pattern pattern = Pattern.compile("\\[\\s*\\{.*?\\}\\s*(,\\s*\\{.*?\\}\\s*)*\\]", Pattern.DOTALL);
            Matcher matcher = pattern.matcher(content);
            
            List<Question> questions = new ArrayList<>();
            
            if (matcher.find()) {
                String questionsJson = matcher.group();
                
                try {
                    List<Map<String, Object>> questionsList = objectMapper.readValue(
                        questionsJson, 
                        objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class)
                    );
                    
                    for (Map<String, Object> questionMap : questionsList) {
                        Question question = createQuestionFromMap(questionMap);
                        if (question != null) {
                            questions.add(question);
                        }
                    }
                } catch (Exception e) {
                    parseIndividualQuestions(content, questions);
                }
            } else {
                parseIndividualQuestions(content, questions);
            }
            
            return questions;
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }
    
    public List<Question> generateQuestionsFromContent(String content, int numberOfQuestions, String difficulty) {
        try {
            String difficultyLevel = (difficulty != null && !difficulty.isEmpty()) ? difficulty : "medium";
            
            String prompt = String.format(
                "Generate %d multiple-choice questions based on the following content. " +
                "Each question should have exactly 4 options (A, B, C, D) with one correct answer. " +
                "Make questions with %s difficulty level. " +
                "Format each question in JSON like this: " +
                "{ " +
                "\"question\": \"What is the question?\", " +
                "\"optionA\": \"First option\", " +
                "\"optionB\": \"Second option\", " +
                "\"optionC\": \"Third option\", " +
                "\"optionD\": \"Fourth option\", " +
                "\"correctAns\": \"A\" " +
                "} " +
                "Provide an array of %d question objects in this format. " +
                "The correct answer should be one of: A, B, C, or D. " +
                "Do not include backticks, code blocks, or any markdown formatting in your response. " +
                "Here's the content to use: \n\n%s",
                numberOfQuestions, difficultyLevel, numberOfQuestions, content
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + COHERE_API_KEY);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("stream", false);
            requestBody.put("model", "command-a-03-2025");
            
            Map<String, Object> message = new HashMap<>();
            message.put("role", "user");
            message.put("content", prompt);
            
            requestBody.put("messages", List.of(message));

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<String> response = restTemplate.exchange(
                COHERE_API_URL, 
                HttpMethod.POST, 
                entity, 
                String.class
            );
            
            String responseBody = response.getBody();
            Map<String, Object> responseMap = objectMapper.readValue(responseBody, Map.class);
            
            if (responseMap.containsKey("message")) {
                Map<String, Object> messageObj = (Map<String, Object>) responseMap.get("message");
                if (messageObj.containsKey("content")) {
                    List<Map<String, Object>> contentList = (List<Map<String, Object>>) messageObj.get("content");
                    if (!contentList.isEmpty()) {
                        content = (String) contentList.get(0).get("text");
                    }
                }
            }
            
            content = cleanContent(content);
            
            Pattern pattern = Pattern.compile("\\[\\s*\\{.*?\\}\\s*(,\\s*\\{.*?\\}\\s*)*\\]", Pattern.DOTALL);
            Matcher matcher = pattern.matcher(content);
            
            List<Question> questions = new ArrayList<>();
            
            if (matcher.find()) {
                String questionsJson = matcher.group();
                
                try {
                    List<Map<String, Object>> questionsList = objectMapper.readValue(
                        questionsJson, 
                        objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class)
                    );
                    
                    for (Map<String, Object> questionMap : questionsList) {
                        Question question = createQuestionFromMap(questionMap);
                        if (question != null) {
                            questions.add(question);
                        }
                    }
                } catch (Exception e) {
                    parseIndividualQuestions(content, questions);
                }
            } else {
                parseIndividualQuestions(content, questions);
            }
            
            return questions;
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }
    
    private String cleanContent(String content) {
        if (content == null) return "";
        content = content.replace("`", "").replace("```json", "").replace("```", "");
        return content;
    }
    
    private void parseIndividualQuestions(String content, List<Question> questions) {
        Pattern objectPattern = Pattern.compile("\\{.*?\"question\".*?\"correctAns\".*?\\}", Pattern.DOTALL);
        Matcher objectMatcher = objectPattern.matcher(content);
        
        while (objectMatcher.find()) {
            String questionJson = objectMatcher.group();
            try {
                questionJson = cleanContent(questionJson);
                Map<String, Object> questionMap = objectMapper.readValue(questionJson, Map.class);
                Question question = createQuestionFromMap(questionMap);
                if (question != null) {
                    questions.add(question);
                }
            } catch (Exception e) {
                System.err.println("Error parsing individual question JSON: " + e.getMessage());
            }
        }
    }
    
    private Question createQuestionFromMap(Map<String, Object> questionMap) {
        try {
            Question question = new Question();
            question.setQuestion((String) questionMap.get("question"));
            question.setOptionA((String) questionMap.get("optionA"));
            question.setOptionB((String) questionMap.get("optionB"));
            question.setOptionC((String) questionMap.get("optionC"));
            question.setOptionD((String) questionMap.get("optionD"));
            question.setCorrectAns((String) questionMap.get("correctAns"));
            
            if (question.getQuestion() == null || 
                question.getOptionA() == null || 
                question.getOptionB() == null || 
                question.getOptionC() == null || 
                question.getOptionD() == null) {
                return null;
            }
            
            return question;
        } catch (Exception e) {
            System.err.println("Error creating question from map: " + e.getMessage());
            return null;
        }
    }
}