import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, PlusCircle, X, Save, Upload, Loader } from 'lucide-react';
import { motion, useAnimation } from 'framer-motion';
import { Filesystem, Directory } from '@capacitor/filesystem';

// Session Selection Modal Component
const SessionSelectModal = ({ isOpen, onClose, sessions, onSelect, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>
        <h3>Load Session</h3>
        {isLoading ? (
          <div className="loading-container">
            <Loader className="animate-spin" />
            <p>Loading sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <p>No saved sessions found</p>
        ) : (
          <div className="session-list">
            {sessions.map((session, index) => (
              <button
                key={index}
                className="session-list-item"
                onClick={() => onSelect(session)}
              >
                <span className="session-name">{session.name}</span>
                <span className="session-date">
                  {new Date(session.date).toLocaleDateString()}
                </span>
              </button>
            ))}
          </div>
        )}
        <div className="modal-buttons">
          <button className="modal-button cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Progress Modal Component
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

// Caption Modal Component (your existing one)
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

const StorySlider = () => {
  // Existing state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [stories, setStories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const [pendingFiles, setPendingFiles] = useState([]);

  // New state for sessions and loading
  const [sessionSelectOpen, setSessionSelectOpen] = useState(false);
  const [availableSessions, setAvailableSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveProgress, setSaveProgress] = useState(null);
  const [progressMessage, setProgressMessage] = useState('');
  const [showProgress, setShowProgress] = useState(false);

  const mediaRef = useRef(null);
  const controls = useAnimation();

  // Function to ensure directory exists
  const ensureDirectory = async () => {
    try {
      await Filesystem.mkdir({
        path: 'stories',
        directory: Directory.Documents,
        recursive: true
      });
    } catch (error) {
      // Directory might already exist, that's okay
      console.log('Directory check:', error);
    }
  };

 // Helper function to convert blob to base64
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result
        .replace('data:', '')
        .replace(/^.+,/, '');
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const handleSaveSession = async () => {
  if (stories.length === 0) {
    alert('No stories to save!');
    return;
  }

  const name = prompt('Enter a name for this session:', 'My Story Session');
  if (!name) return;

  setShowProgress(true);
  setProgressMessage('Saving session...');

  try {
    const sessionDir = `stories/${name.replace(/[^a-z0-9]/gi, '_')}`;
    const savedStories = [];

    // Save media files
    for (let i = 0; i < stories.length; i++) {
      const story = stories[i];
      setSaveProgress((i / stories.length) * 100);
      setProgressMessage(`Saving media ${i + 1} of ${stories.length}...`);

      try {
        // Fetch the blob URL
        const response = await fetch(story.url);
        const blob = await response.blob();

        // Convert blob to base64
        const base64Data = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
          };
          reader.readAsDataURL(blob);
        });

        // Generate filename
        const ext = story.type === 'image' ? 'jpg' : 
                   story.type === 'video' ? 'mp4' : 'mp3';
        const fileName = `media_${i}.${ext}`;
        const filePath = `${sessionDir}/${fileName}`;

        // Save media file
        await Filesystem.writeFile({
          path: filePath,
          data: base64Data,
          directory: Directory.Data,
          encoding: 'base64'
        });

        savedStories.push({
          type: story.type,
          caption: story.caption,
          fileName: fileName // Store just the filename
        });

      } catch (e) {
        console.error('Error saving file:', e);
        throw new Error(`Failed to save file ${i}: ${e.message}`);
      }
    }

    // Save metadata
    const metadataString = JSON.stringify({
      name,
      date: new Date().toISOString(),
      stories: savedStories
    });

    await Filesystem.writeFile({
      path: `${sessionDir}/session.json`,
      data: btoa(metadataString),
      directory: Directory.Data,
      encoding: 'base64'
    });

    setSaveProgress(100);
    setTimeout(() => {
      setShowProgress(false);
      alert('Session saved successfully!');
    }, 500);

  } catch (error) {
    console.error('Error saving session:', error);
    setShowProgress(false);
    alert(`Error saving session: ${error.message}`);
  }
};

// And update the load function to match:
const loadAvailableSessions = async () => {
  setIsLoading(true);
  try {
    const result = await Filesystem.readdir({
      path: 'stories',
      directory: Directory.Data
    });

    const sessions = await Promise.all(result.files
      .filter(file => file.type === 'directory')
      .map(async (dir) => {
        try {
          const sessionData = await Filesystem.readFile({
            path: `stories/${dir.name}/session.json`,
            directory: Directory.Data,
            encoding: 'base64'  // Specify that we're reading base64 data
          });
          
          // Decode the base64 data before parsing JSON
          const decodedData = atob(sessionData.data);
          return JSON.parse(decodedData);
          
        } catch (error) {
          console.error(`Error reading session ${dir.name}:`, error);
          return null;
        }
      }));

    setAvailableSessions(sessions.filter(s => s !== null));
  } catch (error) {
    console.error('Error loading sessions:', error);
    setAvailableSessions([]);
  }
  setIsLoading(false);
};

  const handleLoadSession = async () => {
    await loadAvailableSessions();
    setSessionSelectOpen(true);
  };

  const handleSessionSelect = async (session) => {
    setSessionSelectOpen(false);
    setShowProgress(true);
    setProgressMessage('Loading session...');
    setSaveProgress(0);
  
    try {
      const totalStories = session.stories.length;
      const loadedStories = await Promise.all(session.stories.map(async (story, index) => {
        setSaveProgress((index / totalStories) * 100);
        setProgressMessage(`Loading media ${index + 1} of ${totalStories}...`);
  
        // Construct the full path for the media file
        const mediaPath = `stories/${session.name.replace(/[^a-z0-9]/gi, '_')}/${story.fileName}`;
  
        // Read the media file
        const mediaData = await Filesystem.readFile({
          path: mediaPath,
          directory: Directory.Data,
          encoding: 'base64'
        });
  
        // Create a blob URL from the base64 data
        const mediaType = story.type === 'image' ? 'image/jpeg' :
                         story.type === 'video' ? 'video/mp4' : 'audio/mpeg';
        
        const blob = await fetch(`data:${mediaType};base64,${mediaData.data}`).then(r => r.blob());
        const url = URL.createObjectURL(blob);
  
        return {
          ...story,
          url: url,
          type: story.type
        };
      }));
  
      setStories(loadedStories);
      setCurrentIndex(0);
      setSaveProgress(100);
      setTimeout(() => setShowProgress(false), 500);
    } catch (error) {
      console.error('Error loading session:', error);
      setShowProgress(false);
      alert('Error loading session. Please try again.');
    }
  };

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
      <div className="slider-container">
      <div className="session-controls">
        <button className="session-button" onClick={handleSaveSession}>
          <Save size={20} />
          <span>Save Session</span>
        </button>
        <button className="session-button" onClick={handleLoadSession}>
          <Upload size={20} />
          <span>Load Session</span>
        </button>
      </div>
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
      </div>
    );
  }

  return (
    <div className="slider-container">
      <div className="session-controls">
        <button className="session-button" onClick={handleSaveSession}>
          <Save size={20} />
          <span>Save Session</span>
        </button>
        <button className="session-button" onClick={handleLoadSession}>
          <Upload size={20} />
          <span>Load Session</span>
        </button>
      </div>
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
      
      <SessionSelectModal
        isOpen={sessionSelectOpen}
        onClose={() => setSessionSelectOpen(false)}
        sessions={availableSessions}
        onSelect={handleSessionSelect}
        isLoading={isLoading}
      />

      <ProgressModal
        isOpen={showProgress}
        progress={saveProgress}
        message={progressMessage}
      />
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
      </div>
    </div>
  );
};

export default StorySlider;