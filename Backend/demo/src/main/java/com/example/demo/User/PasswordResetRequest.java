package com.example.demo.User;

public class PasswordResetRequest {
    private String email;
    private String newPassword;

    public PasswordResetRequest() {
    
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}
