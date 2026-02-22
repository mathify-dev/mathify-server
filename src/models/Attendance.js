import { Schema,model } from "mongoose";

// Regex to validate "HH:mm" format (24-hour)
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const attendanceSchema = new Schema({
  student: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },

  startTime: {
    type: String,
    required: true,
    validate: {
      validator: (v) => timeRegex.test(v),
      message: (props) => `${props.value} is not a valid time in HH:mm format.`,
    },
  },

  endTime: {
    type: String,
    required: false,
    validate: {
      validator: (v) => v == null || v === '' || timeRegex.test(v),
      message: (props) => `${props.value} is not a valid time in HH:mm format.`,
    },
  },

  hours: {
    type: Number,
    min: 0,
  },

  date: {
    type: Date,
    required: true,
    default: () => new Date().setHours(0, 0, 0, 0),
  },

  isPresent: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

// Validate endTime is after startTime (only when both are provided)
attendanceSchema.pre('validate', function (next) {
  if (this.startTime && this.endTime && this.endTime.trim() !== '') {
    const [sh, sm] = this.startTime.split(':').map(Number);
    const [eh, em] = this.endTime.split(':').map(Number);

    const start = sh * 60 + sm;
    const end = eh * 60 + em;

    if (end <= start) {
      return next(new Error('endTime must be after startTime'));
    }
  }
  next();
});

// Calculate hours before saving
attendanceSchema.pre('save', function (next) {
  if (this.startTime && this.endTime && this.endTime.trim() !== '') {
    const [sh, sm] = this.startTime.split(':').map(Number);
    const [eh, em] = this.endTime.split(':').map(Number);

    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    const diffMinutes = end - start;

    const rawHours = diffMinutes / 60;
    this.hours = Math.round(rawHours * 4) / 4; // round to nearest 0.25 (15 mins)
  } else {
    this.hours = 0;
  }

  next();
});

export default model('Attendance', attendanceSchema);
