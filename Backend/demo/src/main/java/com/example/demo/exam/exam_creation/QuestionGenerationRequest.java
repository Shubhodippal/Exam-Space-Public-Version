package com.example.demo.exam.exam_creation;

public class QuestionGenerationRequest {
    private String examUid;
    private String creatorUid;
    private Integer numberOfQuestions;
    private String subject;      
    private String topic;
    private String[] specificAreas;
    private String difficulty; 
    
    public String getExamUid() {
        return examUid;
    }
    
    public void setExamUid(String examUid) {
        this.examUid = examUid;
    }
    
    public String getCreatorUid() {
        return creatorUid;
    }
    
    public void setCreatorUid(String creatorUid) {
        this.creatorUid = creatorUid;
    }
    
    public Integer getNumberOfQuestions() {
        return numberOfQuestions;
    }
    
    public void setNumberOfQuestions(Integer numberOfQuestions) {
        this.numberOfQuestions = numberOfQuestions;
    }
    
    public String getSubject() {
        return subject;
    }
    
    public void setSubject(String subject) {
        this.subject = subject;
    }
    
    public String getTopic() {
        return topic;
    }
    
    public void setTopic(String topic) {
        this.topic = topic;
    }
    
    public String[] getSpecificAreas() {
        return specificAreas;
    }
    
    public void setSpecificAreas(String[] specificAreas) {
        this.specificAreas = specificAreas;
    }
    
    public String getDifficulty() {
        return difficulty;
    }
    
    public void setDifficulty(String difficulty) {
        this.difficulty = difficulty;
    }
}
