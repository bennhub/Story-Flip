import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react';

const StorySlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [stories, setStories] = useState([]);

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    
    const newStories = files.map(file => {
      const url = URL.createObjectURL(file);
      const fileType = file.type.split('/')[0]; // 'image', 'video', or 'audio'
      
      return {
        type: fileType,
        url: url,
        caption: file.name,
        duration: fileType === 'audio' || fileType === 'video' ? 0 : undefined
      };
    });

    setStories(prevStories => [...prevStories, ...newStories]);
  };

  // Add upload button if no stories
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

  const handleNext = () => {
    if (currentIndex < stories.length - 1 && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
        setTimeout(() => {
          setIsTransitioning(false);
        }, 300);
      }, 10);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0 && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(currentIndex - 1);
        setTimeout(() => {
          setIsTransitioning(false);
        }, 300);
      }, 10);
    }
  };

  const renderStoryContent = (story) => {
    switch (story.type) {
      case 'image':
        return (
          <img 
            src={story.url} 
            alt={story.caption}
            className="media-content"
          />
        );
      case 'video':
        return (
          <div className="media-content">
            <video
              className="media-content"
              controls
              playsInline
              poster={story.url}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            >
              <source src={story.url} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        );
      case 'audio':
        return (
          <div className="audio-container">
            <h3>{story.caption}</h3>
            <audio
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

  return (
    <div 
      className="story-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className="story-slide"
        style={{
          transform: isTransitioning 
            ? `translateX(${touchEnd && touchStart ? (touchEnd - touchStart) / 5 : 0}px) rotateY(${currentIndex > (touchEnd && touchStart ? currentIndex - 1 : currentIndex) ? '-90deg' : '90deg'})`
            : 'none'
        }}
      >
        {renderStoryContent(stories[currentIndex])}
      </div>

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
        <label htmlFor="file-upload" className="upload-button-small">
          <PlusCircle size={24} />
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

      <div className="caption">
        {stories[currentIndex].caption}
      </div>
    </div>
  );
};

export default StorySlider;