import React, { useState } from 'react';
import { Plus, Trash2, MoveUp, MoveDown, Code } from 'lucide-react';
import CodeSnippet from './CodeSnippet';
import './WorkflowEditor.css';

const WorkflowEditor = ({ steps = [], onChange }) => {
  const [workflowSteps, setWorkflowSteps] = useState(steps.length > 0 ? steps : [
    {
      id: Date.now(),
      step_number: 1,
      title: '',
      description: '',
      code_snippet: '',
      code_language: 'powershell',
      success_outcome: '',
      failure_outcome: '',
      next_step_on_success: null,
      next_step_on_failure: null,
    }
  ]);

  const updateStep = (id, field, value) => {
    const updated = workflowSteps.map(step =>
      step.id === id ? { ...step, [field]: value } : step
    );
    setWorkflowSteps(updated);
    onChange(updated);
  };

  const addStep = () => {
    const newStep = {
      id: Date.now(),
      step_number: workflowSteps.length + 1,
      title: '',
      description: '',
      code_snippet: '',
      code_language: 'powershell',
      success_outcome: '',
      failure_outcome: '',
      next_step_on_success: null,
      next_step_on_failure: null,
    };
    const updated = [...workflowSteps, newStep];
    setWorkflowSteps(updated);
    onChange(updated);
  };

  const removeStep = (id) => {
    const updated = workflowSteps
      .filter(step => step.id !== id)
      .map((step, index) => ({ ...step, step_number: index + 1 }));
    setWorkflowSteps(updated);
    onChange(updated);
  };

  const moveStep = (id, direction) => {
    const index = workflowSteps.findIndex(step => step.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === workflowSteps.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...workflowSteps];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    
    // Renumber steps
    updated.forEach((step, idx) => {
      step.step_number = idx + 1;
    });

    setWorkflowSteps(updated);
    onChange(updated);
  };

  return (
    <div className="workflow-editor">
      <div className="workflow-editor-header">
        <h3>Workflow Steps</h3>
        <p>Create a step-by-step troubleshooting guide</p>
      </div>

      <div className="workflow-steps">
        {workflowSteps.map((step, index) => (
          <div key={step.id} className="workflow-step">
            <div className="workflow-step-header">
              <span className="step-number">Step {step.step_number}</span>
              <div className="step-controls">
                <button
                  type="button"
                  onClick={() => moveStep(step.id, 'up')}
                  disabled={index === 0}
                  title="Move up"
                >
                  <MoveUp size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => moveStep(step.id, 'down')}
                  disabled={index === workflowSteps.length - 1}
                  title="Move down"
                >
                  <MoveDown size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => removeStep(step.id)}
                  className="delete-btn"
                  disabled={workflowSteps.length === 1}
                  title="Delete step"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="workflow-step-content">
              {/* Title */}
              <div className="form-group">
                <label>Step Title *</label>
                <input
                  type="text"
                  value={step.title}
                  onChange={(e) => updateStep(step.id, 'title', e.target.value)}
                  placeholder="e.g., Check network connectivity"
                  required
                />
              </div>

              {/* Description */}
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={step.description}
                  onChange={(e) => updateStep(step.id, 'description', e.target.value)}
                  placeholder="Detailed instructions for this step"
                  rows={3}
                />
              </div>

              {/* Code Snippet */}
              <div className="form-group">
                <div className="code-snippet-header-input">
                  <label>
                    <Code size={16} />
                    Code Snippet (optional)
                  </label>
                  <select
                    value={step.code_language}
                    onChange={(e) => updateStep(step.id, 'code_language', e.target.value)}
                    className="language-select"
                  >
                    <option value="powershell">PowerShell</option>
                    <option value="bash">Bash</option>
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="sql">SQL</option>
                    <option value="yaml">YAML</option>
                    <option value="json">JSON</option>
                    <option value="plaintext">Plain Text</option>
                  </select>
                </div>
                <textarea
                  value={step.code_snippet}
                  onChange={(e) => updateStep(step.id, 'code_snippet', e.target.value)}
                  placeholder="Enter code or commands here..."
                  rows={5}
                  className="code-input"
                />
              </div>

              {/* Outcomes */}
              <div className="outcomes-grid">
                <div className="form-group">
                  <label className="success-label">✓ Success Outcome</label>
                  <textarea
                    value={step.success_outcome}
                    onChange={(e) => updateStep(step.id, 'success_outcome', e.target.value)}
                    placeholder="What happens if this step succeeds?"
                    rows={2}
                  />
                </div>

                <div className="form-group">
                  <label className="failure-label">✗ Failure Outcome</label>
                  <textarea
                    value={step.failure_outcome}
                    onChange={(e) => updateStep(step.id, 'failure_outcome', e.target.value)}
                    placeholder="What to do if this step fails?"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="add-step-btn"
        onClick={addStep}
      >
        <Plus size={18} />
        Add Step
      </button>
    </div>
  );
};

export default WorkflowEditor;
