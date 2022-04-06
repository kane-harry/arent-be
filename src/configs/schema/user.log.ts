export const userLogSchema = {
  agent: {
    type: String,
    required: false,
    default: ''
  },
  data_after: {
    type: Object,
    required: false,
    default: {}
  },
  data_before: {
    type: Object,
    required: false,
    default: {}
  },
  ip_address: {
    type: String,
    required: false,
    default: ''
  },
  created_at: {
    type: Date,
    required: false,
    default: new Date()
  },
  modified_at: {
    type: Date,
    required: false,
    default: new Date()
  }
}
