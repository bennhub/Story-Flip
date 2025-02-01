//==============================================
// IMPORTS
//==============================================
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, PlusCircle, X, Save, Loader, ImagePlus, Clock, Play, Pause } from 'lucide-react';
import { motion, useAnimation } from 'framer-motion';
import { Filesystem, Directory } from '@capacitor/filesystem';

//==============================================
// MODAL COMPONENTS
//==============================================
const ProgressModal = ({ isOpen, progress, message }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="loading-container">
          <Loader className="animate-spin" />
          <p>{message}</p>
          {progress !== null && (
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CaptionModal = ({ isOpen, onClose, onSubmit, fileName }) => {
  const [caption, setCaption] = useState('');

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>
        <h3>Add a Caption</h3>
        <p className="modal-filename">{fileName}</p>
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Enter your caption..."
          className="modal-input"
          autoFocus
        />
        <div className="modal-buttons">
          <button className="modal-button cancel" onClick={onClose}>
            Skip
          </button>
          <button className="modal-button submit" onClick={() => onSubmit(caption)}>
            Add Caption
          </button>
        </div>
      </div>
    </div>
  );
};

//==============================================
// BOTTOM MENU COMPONENT
//==============================================
const BottomMenu = ({ onFileUpload, onSaveSession, onPlayPause, isPlaying, duration, onDurationChange }) => {
  const [showDurationPanel, setShowDurationPanel] = useState(false);

  return (
    <div className="bottom-menu">
      {showDurationPanel && (
        <div className="duration-panel">
          <div className="duration-controls">
            <input 
              type="range"
              min="1"
              max="12"
              value={duration}
              onChange={(e) => onDurationChange(parseInt(e.target.value))}
              className="duration-slider"
            />
            <div className="duration-text">
              Speed: {duration}s/image
            </div>
          </div>
          <div className="duration-timeline">
            {[...Array(12)].map((_, index) => (
              <div key={index} className="timeline-marker">
                {index + 1}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="bottom-menu-buttons">
        <button 
          className="bottom-menu-button"
          onClick={() => setShowDurationPanel(!showDurationPanel)}
        >
          <Clock className="bottom-menu-icon" />
          <span className="bottom-menu-text"></span>
        </button>

        <button 
          className="bottom-menu-button"
          onClick={onPlayPause}
        >
          {isPlaying ? (
            <Pause className="bottom-menu-icon" />
          ) : (
            <Play className="bottom-menu-icon" />
          )}
          <span className="bottom-menu-text">{isPlaying ? 'Pause' : 'Play'}</span>
        </button>

        <div className="bottom-menu-right-group">
          <label className="bottom-menu-button">
            <ImagePlus className="bottom-menu-icon" />
            <span className="bottom-menu-text"></span>
            <input
              type="file"
              id="file-upload-bottom"
              accept="image/*,video/*,audio/*"
              multiple
              onChange={onFileUpload}
              className="hidden-input"
            />
          </label>

          <button className="bottom-menu-button" onClick={onSaveSession}>
            <Save className="bottom-menu-icon" />
            <span className="bottom-menu-text"></span>
          </button>
        </div>
      </div>
    </div>
  );
};

//==============================================
// MAIN STORY SLIDER COMPONENT
//==============================================
const StorySlider = () => {
  //--------------------------------------------
  // State Declarations
  //--------------------------------------------
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [stories, setStories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [saveProgress, setSaveProgress] = useState(null);
  const [progressMessage, setProgressMessage] = useState('');
  const [showProgress, setShowProgress] = useState(false);
  const [duration, setDuration] = useState(2); // Default duration

  // Refs and Animations
  const mediaRef = useRef(null);
  const intervalRef = useRef(null);
  const controls = useAnimation();

  //--------------------------------------------
  // Auto-Rotation Logic
  //--------------------------------------------
  const startAutoRotation = () => {
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        if (prevIndex < stories.length - 1) {
          return prevIndex + 1;
        } else {
          clearInterval(intervalRef.current); // Stop at the end
          setIsPlaying(false); // Pause when done
          return 0; // Optionally loop back to the start
        }
      });
    }, duration * 1000); // Convert seconds to milliseconds
  };

  const stopAutoRotation = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      stopAutoRotation();
    } else {
      startAutoRotation();
    }
    setIsPlaying((prev) => !prev);
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => stopAutoRotation();
  }, []);

  // Sync duration with auto-rotation
  useEffect(() => {
    if (isPlaying) {
      stopAutoRotation();
      startAutoRotation();
    }
  }, [duration]);

  //--------------------------------------------
  // File System Handlers
  //--------------------------------------------
  const ensureDirectory = async () => {
    try {
      await Filesystem.mkdir({
        path: 'stories',
        directory: Directory.Documents,
        recursive: true
      });
    } catch (error) {
      console.log('Directory check:', error);
    }
  };

  //--------------------------------------------
  // Session Handlers
  //--------------------------------------------
  const handleSaveSession = async () => {
    setShowProgress(true);
    setProgressMessage('Preparing to export video...');
    setSaveProgress(0);

    // TODO: Implement video export functionality here
    setTimeout(() => {
      setShowProgress(false);
      alert('Video export functionality will be implemented here.');
    }, 1000);
  };

  //--------------------------------------------
  // Effect Hooks
  //--------------------------------------------
  useEffect(() => {
    const currentStory = stories[currentIndex];
  
    if (currentStory?.type === 'video' || currentStory?.type === 'audio') {
      const mediaElement = mediaRef.current;
      if (mediaElement) {
        mediaElement.play().catch(err => console.log('Autoplay prevented:', err));
      }
    }
  
    if (currentIndex < stories.length - 1) {
      const nextStory = stories[currentIndex + 1];
      if (nextStory) {
        if (nextStory.type === 'image') {
          const img = new Image();
          img.src = nextStory.url;
        } else if (nextStory.type === 'video' || nextStory.type === 'audio') {
          const media = document.createElement(nextStory.type === 'video' ? 'video' : 'audio');
          media.src = nextStory.url;
          media.preload = 'auto';
        }
      }
    }
  }, [currentIndex, stories]);

  //--------------------------------------------
  // File Upload Handlers
  //--------------------------------------------
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
  
    const newStories = files.map(file => {
      const url = URL.createObjectURL(file);
      const fileType = file.type.split('/')[0];
  
      const wantCaption = window.confirm("Would you like to add a caption? Click OK for yes, Cancel to skip.");
      
      let caption;
      if (wantCaption) {
        caption = prompt("Let's add a caption!", file.name) || file.name;
      } else {
        caption = file.name;
      }
  
      return {
        type: fileType,
        url: url,
        caption: caption,
        duration: fileType === 'audio' || fileType === 'video' ? 0 : undefined
      };
    });
  
    setStories(prevStories => [...prevStories, ...newStories]);
  };

  const processNextFile = () => {
    if (pendingFiles.length === 0) return;
    
    const nextFile = pendingFiles[0];
    setCurrentFile(nextFile);
    setModalOpen(true);
  };

  //--------------------------------------------
  // Caption Handlers
  //--------------------------------------------
  const handleCaptionSubmit = (caption) => {
    const file = currentFile;
    const url = URL.createObjectURL(file);
    const fileType = file.type.split('/')[0];

    const newStory = {
      type: fileType,
      url: url,
      caption: caption || file.name,
      duration: fileType === 'audio' || fileType === 'video' ? 0 : undefined
    };

    setStories(prevStories => [...prevStories, newStory]);
    
    const remainingFiles = pendingFiles.slice(1);
    setPendingFiles(remainingFiles);
    setModalOpen(false);
    
    if (remainingFiles.length > 0) {
      setTimeout(processNextFile, 100);
    }
  };

  const handleModalClose = () => {
    handleCaptionSubmit(currentFile.name);
  };

  //--------------------------------------------
  // Touch Navigation Handlers
  //--------------------------------------------
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentIndex < stories.length - 1) {
      handleNext();
    }
    if (isRightSwipe && currentIndex > 0) {
      handlePrevious();
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  //--------------------------------------------
  // Navigation Handlers
  //--------------------------------------------
  const handleNext = async () => {
    if (currentIndex < stories.length - 1) {
      await controls.start(
        { opacity: 1 },
        { duration: 0.5 }
      );
      setCurrentIndex(currentIndex + 1);
      controls.set({ opacity: 0 });
      await controls.start(
        { opacity: 1 },
        { duration: 0.5 }
      );
    }
  };
  
  const handlePrevious = async () => {
    if (currentIndex > 0) {
      await controls.start(
        { opacity: 1 },
        { duration: 0.5 }
      );
      setCurrentIndex(currentIndex - 1);
      controls.set({ opacity: 0 });
      await controls.start(
        { opacity: 1 },
        { duration: 0.5 }
      );
    }
  };

  //--------------------------------------------
  // Content Rendering Functions
  //--------------------------------------------
  const renderStoryContent = (story, index) => {
    if (!story || !story.type) {
      console.warn("Skipping rendering: story is undefined or missing type", story);
      return null;
    }
  
    switch (story.type) {
      case 'image':
        return (
          <div className="media-content">
            <img src={story.url} alt={story.caption || "Image"} className="media-content" />
            <div className="caption">{story.caption}</div>
          </div>
        );
      case 'video':
        return (
          <div className="media-content">
            <video
              key={index}
              ref={mediaRef}
              className="media-content"
              controls
              playsInline
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            >
              <source src={story.url} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <div className="caption">{story.caption}</div>
          </div>
        );
      case 'audio':
        return (
          <div className="audio-container">
            <h3>{story.caption}</h3>
            <audio
              key={index}
              ref={mediaRef}
              controls
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            >
              <source src={story.url} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        );
      default:
        return <p>Unsupported content type</p>;
    }
  };

  //--------------------------------------------
  // Render
  //--------------------------------------------
  return (
    <div className="slider-container">
      <div 
        className="story-container"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <motion.div
          className="story-slide"
          animate={controls}
          initial={{ rotateY: 0, opacity: 1 }}
          transition={{ type: 'tween', duration: 0.5 }}
          style={{ perspective: 1000 }}
        >
          {renderStoryContent(stories[currentIndex], currentIndex)}
        </motion.div>

        <button
          onClick={handlePrevious}
          className="nav-button prev"
          disabled={currentIndex === 0}
        >
          <ChevronLeft />
        </button>

        <button
          onClick={handleNext}
          className="nav-button next"
          disabled={currentIndex === stories.length - 1}
        >
          <ChevronRight />
        </button>

        <div className="progress-container">
          {stories.map((_, index) => (
            <div
              key={index}
              className={`progress-bar ${index === currentIndex ? 'active' : ''}`}
            />
          ))}
        </div>

        <CaptionModal
          isOpen={modalOpen}
          onClose={handleModalClose}
          onSubmit={handleCaptionSubmit}
          fileName={currentFile?.name || ''}
        />

        <ProgressModal
          isOpen={showProgress}
          progress={saveProgress}
          message={progressMessage}
        />
      </div>

      <BottomMenu 
        onFileUpload={handleFileUpload} 
        onSaveSession={handleSaveSession}
        onPlayPause={handlePlayPause}
        isPlaying={isPlaying}
        duration={duration}
        onDurationChange={setDuration}
      />
    </div>
  );
};

export default StorySlider;