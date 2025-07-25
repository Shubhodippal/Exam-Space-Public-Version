import { useState } from 'react';
import './ExamSection.css';

function CreateExamForm({ onSubmit, onCancel, getUserId }) {
  const [newExam, setNewExam] = useState({
    title: '',
    description: '',
    marks: 100,
    passcode: ''
  });

  const handleExamChange = (e) => {
    const { name, value } = e.target;
    setNewExam({
      ...newExam,
      [name]: value,
    });
  };

  const handleSubmitExam = async (e) => {
    e.preventDefault();
    
    try {
      const userId = getUserId();
      
      if (!userId) {
        return;
      }
      
      if (!newExam.title || !newExam.marks || !newExam.passcode) {
        return;
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/exam/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': import.meta.env.VITE_API_KEY
        },
        body: JSON.stringify({
          examName: newExam.title,
          creatorUid: userId,
          marks: parseInt(newExam.marks) || 100,
          examPasscode: newExam.passcode
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error creating exam: ${response.status}`);
      }
      
      onSubmit();
      
      setNewExam({
        title: '',
        description: '',
        marks: 100,
        passcode: ''
      });
    } catch (error) {
      console.error('Error creating exam:', error);
    }
  };

  return (
    <div className="create-exam-form">
      <h3>Create New Exam</h3>
      <form onSubmit={handleSubmitExam}>
        <div className="form-group">
          <label htmlFor="title">Exam Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={newExam.title}
            onChange={handleExamChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="marks">Total Marks</label>
          <input
            type="number"
            id="marks"
            name="marks"
            value={newExam.marks}
            onChange={handleExamChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="passcode">Exam Passcode</label>
          <input
            type="text"
            id="passcode"
            name="passcode"
            value={newExam.passcode}
            onChange={handleExamChange}
            required
          />
        </div>
        
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Create Exam
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateExamForm;