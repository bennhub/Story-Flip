import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react';
import { motion, useAnimation } from 'framer-motion';

const StorySlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [stories, setStories] = useState([]);
  const mediaRef = useRef(null);
  const controls = useAnimation();

  useEffect(() => {
    const currentStory = stories[currentIndex];
  
    // Autoplay current story if it's a video or audio
    if (currentStory?.type === 'video' || currentStory?.type === 'audio') {
      const mediaElement = mediaRef.current;
      if (mediaElement) {
        mediaElement.play().catch(err => console.log('Autoplay prevented:', err));
      }
    }
  
    // Preload the next story's media
    if (currentIndex < stories.length - 1) {
      const nextStory = stories[currentIndex + 1];
      if (nextStory) {
        if (nextStory.type === 'image') {
          const img = new Image();
          img.src = nextStory.url; // Preload the image
        } else if (nextStory.type === 'video' || nextStory.type === 'audio') {
          const media = document.createElement(nextStory.type === 'video' ? 'video' : 'audio');
          media.src = nextStory.url;
          media.preload = 'auto'; // Preload the video or audio
        }
      }
    }
  }, [currentIndex, stories]);

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
        { opacity: 1 }, // Fade out
        { duration: 0.5 } // Faster fade (0.2 seconds)
      );
      setCurrentIndex(currentIndex + 1);
      controls.set({ opacity: 0 }); // Reset opacity for next slide
      await controls.start(
        { opacity: 1 }, // Fade in
        { duration: 0.5 } // Faster fade (0.2 seconds)
      );
    }
  };
  
  const handlePrevious = async () => {
    if (currentIndex > 0) {
      await controls.start(
        { opacity: 1 }, // Fade out
        { duration: 0.5 } // Faster fade (0.2 seconds)
      );
      setCurrentIndex(currentIndex - 1);
      controls.set({ opacity: 0 }); // Reset opacity for previous slide
      await controls.start(
        { opacity: 1 }, // Fade in
        { duration: 0.5 } // Faster fade (0.2 seconds)
      );
    }
  };

  const pauseCurrentMedia = () => {
    const mediaElement = mediaRef.current;
    if (mediaElement) {
      mediaElement.pause();
    }
  };

  const renderStoryContent = (story, index) => {
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
              key={index} // Force re-render when index changes
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
          </div>
        );
      case 'audio':
        return (
          <div className="audio-container">
            <h3>{story.caption}</h3>
            <audio
              key={index} // Force re-render when index changes
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
        style={{ perspective: 1000 }} // Add perspective for 3D effect
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

      {/* <div className="caption">
        {stories[currentIndex].caption}
      </div> */}
    </div>
  );
};

export default StorySlider;