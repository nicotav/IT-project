import React, { useState, useEffect } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { ArticleForm } from '../../shared/src/components/forms.js'
import { LoadingSpinner, ErrorMessage } from '../../shared/src/components/index.js'
import { Save, X, Eye, Code, FileText, Workflow } from 'lucide-react';
import WorkflowEditor from './WorkflowEditor';
import './ArticleEditor.css';

const ArticleEditor = ({ 
  article = null, 
  onSave, 
  onCancel,
  categories = [],
  loading = false,
  error = null
}) => {
  const [preview, setPreview] = useState(false);
  const [workflowSteps, setWorkflowSteps] = useState(article?.workflow_steps || []);
  const [formData, setFormData] = useState({
    title: article?.title || '',
    summary: article?.summary || '',
    content: article?.content || '',
    category_id: article?.category_id || '',
    itil_process: article?.itil_process || '',
    tags: article?.tags || '',
    article_type: article?.article_type || 'reference',
    is_published: article?.is_published || false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = { ...formData };
    if (formData.article_type === 'workflow') {
      submitData.workflow_steps = workflowSteps;
    }
    onSave(submitData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="article-editor">
      <form onSubmit={handleSubmit} className="article-editor-form">
        {/* Header */}
        <div className="article-editor-header">
          <h2>
            {article ? 'Edit Article' : 'Create New Article'}
          </h2>
          <div className="article-editor-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onCancel}
            >
              <X size={18} />
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              <Save size={18} />
              {article ? 'Update' : 'Create'} Article
            </button>
          </div>
        </div>

        {/* Article Type Selection */}
        <div className="article-type-selector">
          <label>Article Type</label>
          <div className="article-type-options">
            <button
              type="button"
              className={`article-type-option ${formData.article_type === 'reference' ? 'active' : ''}`}
              onClick={() => handleChange('article_type', 'reference')}
            >
              <FileText size={20} />
              <div>
                <strong>Reference</strong>
                <span>Documentation, guides, procedures</span>
              </div>
            </button>
            <button
              type="button"
              className={`article-type-option ${formData.article_type === 'workflow' ? 'active' : ''}`}
              onClick={() => handleChange('article_type', 'workflow')}
            >
              <Workflow size={20} />
              <div>
                <strong>Workflow</strong>
                <span>Step-by-step troubleshooting</span>
              </div>
            </button>
            <button
              type="button"
              className={`article-type-option ${formData.article_type === 'snippet' ? 'active' : ''}`}
              onClick={() => handleChange('article_type', 'snippet')}
            >
              <Code size={20} />
              <div>
                <strong>Code Snippet</strong>
                <span>Reusable scripts and commands</span>
              </div>
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Enter article title"
            required
          />
        </div>

        {/* Summary */}
        <div className="form-group">
          <label htmlFor="summary">Summary</label>
          <textarea
            id="summary"
            value={formData.summary}
            onChange={(e) => handleChange('summary', e.target.value)}
            placeholder="Brief summary of the article"
            rows={3}
          />
        </div>

        {/* Metadata Row */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={formData.category_id}
              onChange={(e) => handleChange('category_id', e.target.value)}
            >
              <option value="">Select category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="itil_process">ITIL Process</label>
            <select
              id="itil_process"
              value={formData.itil_process}
              onChange={(e) => handleChange('itil_process', e.target.value)}
            >
              <option value="">Select process</option>
              <option value="incident">Incident Management</option>
              <option value="problem">Problem Management</option>
              <option value="change">Change Management</option>
              <option value="release">Release Management</option>
              <option value="service_request">Service Request</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags</label>
            <input
              type="text"
              id="tags"
              value={formData.tags}
              onChange={(e) => handleChange('tags', e.target.value)}
              placeholder="powershell, network, windows"
            />
            <small>Comma-separated tags</small>
          </div>
        </div>

        {/* Markdown Content Editor */}
        <div className="form-group">
          <div className="editor-toolbar">
            <label>Content *</label>
            <button
              type="button"
              className="preview-toggle"
              onClick={() => setPreview(!preview)}
            >
              <Eye size={16} />
              {preview ? 'Edit' : 'Preview'}
            </button>
          </div>
          
          <div className="markdown-editor-container" data-color-mode="light">
            <MDEditor
              value={formData.content}
              onChange={(value) => handleChange('content', value || '')}
              preview={preview ? 'preview' : 'edit'}
              height={500}
              visibleDragbar={false}
              highlightEnable={true}
              enableScroll={true}
            />
          </div>
        </div>

        {/* Workflow Steps Editor */}
        {formData.article_type === 'workflow' && (
          <div className="form-group">
            <WorkflowEditor
              steps={workflowSteps}
              onChange={setWorkflowSteps}
            />
          </div>
        )}

        {/* Publish Toggle */}
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.is_published}
              onChange={(e) => handleChange('is_published', e.target.checked)}
            />
            <span>Publish article (make visible to all users)</span>
          </label>
        </div>
      </form>
    </div>
  );
};

export default ArticleEditor;
