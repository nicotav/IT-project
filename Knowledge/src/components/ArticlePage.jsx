import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ArticleEditor from './ArticleEditor';
import WorkflowEditor from './WorkflowEditor';
import { knowledgeAPI } from '../services/api';
import './ArticlePage.css';

function ArticlePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [workflowSteps, setWorkflowSteps] = useState([]);

  useEffect(() => {
    fetchCategories();
    if (id) {
      fetchArticle();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await knowledgeAPI.getCategories();
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchArticle = async () => {
    setLoading(true);
    try {
      const response = await knowledgeAPI.getArticle(id);
      setArticle(response.data);
      
      // Fetch workflow steps if it's a workflow article
      if (response.data.article_type === 'workflow') {
        const stepsResponse = await knowledgeAPI.getWorkflowSteps(id);
        setWorkflowSteps(stepsResponse.data.steps || []);
      }
    } catch (error) {
      console.error('Error fetching article:', error);
      alert('Failed to load article');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData) => {
    setLoading(true);
    try {
      // If it's a workflow article, add the workflow steps
      if (formData.article_type === 'workflow' && workflowSteps.length > 0) {
        formData.workflow_steps = workflowSteps.map(step => ({
          step_number: step.step_number,
          title: step.title,
          description: step.description,
          code_snippet: step.code_snippet,
          code_language: step.code_language,
          success_outcome: step.success_outcome,
          failure_outcome: step.failure_outcome,
          next_step_on_success: step.next_step_on_success,
          next_step_on_failure: step.next_step_on_failure,
        }));
      }

      if (id) {
        // Update existing article
        await knowledgeAPI.updateArticle(id, formData);
        alert('Article updated successfully!');
      } else {
        // Create new article
        const response = await knowledgeAPI.createArticle(formData);
        alert('Article created successfully!');
        navigate(`/article/${response.data.article_id}`);
        return;
      }
      
      navigate('/');
    } catch (error) {
      console.error('Error saving article:', error);
      alert(error.response?.data?.detail || 'Failed to save article');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  if (loading && id) {
    return (
      <div className="article-page">
        <div className="loading">Loading article...</div>
      </div>
    );
  }

  return (
    <div className="article-page">
      <ArticleEditor
        article={article}
        onSave={handleSave}
        onCancel={handleCancel}
        categories={categories}
      />
      
      {/* Show WorkflowEditor below ArticleEditor for workflow type articles */}
      {/* This will be integrated better in the ArticleEditor component itself */}
    </div>
  );
}

export default ArticlePage;
