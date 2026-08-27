#player-toggle {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: clamp(6px, 2vw, 10px);
}

.player-btn {
  font-size: clamp(13px, 3.5vw, 15px);
  width: auto;
  height: auto;
  padding: clamp(7px, 2vw, 8px) clamp(12px, 3.5vw, 18px);
  background: #333;
  border-radius: 8px;
  touch-action: manipulation;
}

.player-btn.active {
  background: #3b7dd8;
  color: #fff;
}

.kettle-slot.editable {
  cursor: pointer;
}

.kettle-slot.editable:hover {
  border-color: #3b7dd8;
}

#kettles-container {
  position: relative;
  width: 90vw;
  max-width: 1000px;
  height: 20vh;
  min-height: 260px;
}

.kettle-slot {
  position: absolute;
  width: 60px;
  height: 60px;
  transform: translate(-50%, -50%);
  border: 3px solid #ccc;
  border-radius: 8px;
  background: #12121a;
  display: flex;
  align-items: center;
  justify-content: center;
}

.kettle-slot .dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #eee;
}

#kettles-shuffle {
  font-size: clamp(14px, 3.5vw, 16px);
  width: auto;
  height: auto;
  padding: clamp(8px, 2.5vw, 10px) clamp(14px, 4vw, 20px);
  margin-top: clamp(16px, 4vh, 30px);
  background: #7f5af0;
  touch-action: manipulation;
}

#kettles-shuffle:hover {
  background: #6a4bd1;
}

#kettles-move-title {
  margin-top: clamp(20px, 5vh, 40px);
  color: #aaa;
  font-size: clamp(13px, 3.5vw, 15px);
  text-align: center;
  padding: 0 12px;
}

#kettles-move-container {
  position: relative;
  width: 90vw;
  max-width: 1000px;
  height: 34vh;
  min-height: 220px;
  margin-top: clamp(8px, 2vh, 10px);
}

.kettle-move-slot {
  position: absolute;
  width: 54px;
  height: 54px;
  transform: translate(-50%, -50%);
  border: 3px dashed #555;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;
  touch-action: manipulation;
  transition: border-color 0.2s ease;
}

.kettle-move-slot.has-kettle {
  cursor: pointer;
}

.kettle-move-slot.selectable {
  cursor: pointer;
}

.kettle-move-slot.selected {
  border-color: #3b7dd8;
  border-style: solid;
}

.kettle-icon {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #f0c419;
  border: 2px solid #b8930f;
  pointer-events: none;
}

#kettles-status {
  margin-top: clamp(10px, 2.5vh, 16px);
  font-size: clamp(14px, 3.5vw, 16px);
  color: #ccc;
}

#kettles-status.solved {
  color: #2ecc71;
  font-weight: bold;
}

#kettles-reset {
  font-size: clamp(14px, 3.5vw, 16px);
  width: auto;
  height: auto;
  padding: clamp(8px, 2.5vw, 10px) clamp(14px, 4vw, 20px);
  margin-top: clamp(10px, 2.5vh, 16px);
  margin-bottom: clamp(16px, 4vh, 30px);
  background: #444;
  touch-action: manipulation;
}

#kettles-reset:hover {
  background: #555;
}