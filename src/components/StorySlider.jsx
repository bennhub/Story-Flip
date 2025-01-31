import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, PlusCircle, X } from 'lucide-react';
import { motion, useAnimation } from 'framer-motion';

// Add the CaptionModal component
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
          <button 
            className="modal-button cancel" 
            onClick={onClose}
          >
            Skip
          </button>
          <button 
            className="modal-button submit" 
            onClick={() => onSubmit(caption)}
          >
            Add Caption
          </button>
        </div>
      </div>
    </div>
  );
};

const StorySlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [stories, setStories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const [pendingFiles, setPendingFiles] = useState([]);
  const mediaRef = useRef(null);
  const controls = useAnimation();

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

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
  
    const newStories = files.map(file => {
      const url = URL.createObjectURL(file);
      const fileType = file.type.split('/')[0];
  
      // Ask if user wants to add a caption
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
    console.log('Processing next file');
    console.log('Pending files:', pendingFiles);
    if (pendingFiles.length === 0) return;
    
    const nextFile = pendingFiles[0];
    console.log('Next file to process:', nextFile);
    setCurrentFile(nextFile);
    setModalOpen(true);
  };

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
    
    // Process next file or clean up
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

  const renderStoryContent = (story, index) => {
    switch (story.type) {
      case 'image':
        return (
          <div className="media-content">
            <img
              src={story.url}
              alt={story.caption}
              className="media-content"
              style={{ objectFit: 'contain' }}
            />
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
              style={{ objectFit: 'contain' }}
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
        return null;
    }
  };

  if (stories.length === 0) {
    return (
      <div className="story-container">
        <div className="upload-container">
          <label htmlFor="file-upload" className="upload-button">
            <PlusCircle size={48} />
            <span>Upload Media</span>
            <input
              id="file-upload"
              type="file"
              accept="image/*,video/*,audio/*"
              multiple
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>
    );
  }

  return (
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

      <div className="add-more-button">
        <label htmlFor="file-upload-more" className="upload-button-small">
          <PlusCircle size={24} />
          <input
            id="file-upload-more"
            type="file"
            accept="image/*,video/*,audio/*"
            multiple
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      <CaptionModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        onSubmit={handleCaptionSubmit}
        fileName={currentFile?.name || ''}
      />
    </div>
  );
};

export default StorySlider;