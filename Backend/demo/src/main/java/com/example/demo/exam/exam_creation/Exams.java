package com.example.demo.exam.exam_creation;
import java.time.LocalDateTime;

public class Exams {
    private Long id;
    private String examId;
    private String creatorUid;
    private Integer marks;
    private LocalDateTime createdAt;
    private String state;
    private String examName;
    private String examPasscode;
    private String sharing;
    private String resultPublish;

    public Exams() {
        this.state = "OFF";
        this.createdAt = LocalDateTime.now();
    }

    public Exams(String examId, String creatorUid, String examName) {
        this();
        this.examId = examId;
        this.creatorUid = creatorUid;
        this.examName = examName;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getExamId() {
        return examId;
    }

    public void setExamId(String examId) {
        this.examId = examId;
    }

    public String getCreatorUid() {
        return creatorUid;
    }

    public void setCreatorUid(String creatorUid) {
        this.creatorUid = creatorUid;
    }

    public Integer getMarks() {
        return marks;
    }

    public void setMarks(Integer marks) {
        this.marks = marks;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getExamName() {
        return examName;
    }

    public void setExamName(String examName) {
        this.examName = examName;
    }

    public String getExamPasscode() {
        return examPasscode;
    }

    public void setExamPasscode(String examPasscode) {
        this.examPasscode = examPasscode;
    }

    public String getSharing() {
        return sharing;
    }

    public void setSharing(String sharing) {
        this.sharing = sharing;
    }

    public String getResultPublish() {
        return resultPublish;
    }

    public void setResultPublish(String resultPublish) {
        this.resultPublish = resultPublish;
    }
}
