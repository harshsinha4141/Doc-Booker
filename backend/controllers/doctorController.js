import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import sendEmail from "../utils/sendEmail.js";
// API for doctor Login 
const loginDoctor = async (req, res) => {

    try {

        const { email, password } = req.body
        const user = await doctorModel.findOne({ email })

        if (!user) {
            return res.json({ success: false, message: "Invalid credentials" })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: "Invalid credentials" })
        }


    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get doctor appointments for doctor panel
const appointmentsDoctor = async (req, res) => {
    try {

        const { docId } = req.body
        const appointments = await appointmentModel.find({ docId,
          hideFromDoctor: { $ne: true }
         });

        res.json({ success: true, appointments })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to cancel appointment for doctor panel
const appointmentCancel = async (req, res) => {
  try {
    const { docId, appointmentId,cancelledBy } = req.body;

    const appointmentData = await appointmentModel.findById(appointmentId);

    if (appointmentData && appointmentData.docId.toString() === docId.toString()) {
      await appointmentModel.findByIdAndUpdate(appointmentId, {
        cancelled: true,
      });

      const patientEmail = appointmentData.userData?.email;
      const patientName = appointmentData.userData?.name;
      const doctorEmail = appointmentData.docData?.email;
      const doctorName = appointmentData.docData?.name;
      try{
      if (patientEmail) {
        console.log("Sending cancellation email to patient:");
        await sendEmail(
          patientEmail,
          "Appointment Cancelled",
          `Dear ${
            patientName || "Patient"
          },\n\nYour appointment with Dr. ${doctorName} on ${
            appointmentData.slotDate
          } at ${
            appointmentData.slotTime
          } has been cancelled.\n\nRegards,\nYour Clinic`
        );
        console.log("Patient email sent");
      }
    }
    catch(error)
    {
        console.error("Error sending email to patient:", err.message);
    }

      try{
      if (cancelledBy!=="doctor" && doctorEmail) {
        console.log("Sending cancellation email to doctor:");
        await sendEmail(
          doctorEmail,
          "Appointment Cancelled by Patient",
          `Dear Dr. ${doctorName},\n\nYour patient ${patientName} has cancelled the appointment scheduled on ${appointmentData.slotDate} at ${appointmentData.slotTime}.\n\nRegards,\nYour Clinic`
        );
        console.log("Doctor email sent");
      }
    }
    catch(error)
    {
        console.error("Error sending email to doctor:", err.message);
    }

      return res.json({
        success: true,
        message: "Appointment Cancelled & Email sent",
      });
    }

    res.json({ success: false, message: "Appointment Cancelled" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};


// API to mark appointment completed for doctor panel
const appointmentComplete = async (req, res) => {
  try {
    const { docId, appointmentId } = req.body;

    const appointmentData = await appointmentModel.findById(appointmentId);

    if (appointmentData && appointmentData.docId === docId) {
      await appointmentModel.findByIdAndUpdate(appointmentId, {
        isCompleted: true,
      });

      const patientEmail = appointmentData.userData?.email;
      const patientName = appointmentData.userData?.name;
      const doctorEmail = appointmentData.docData?.email;
      const doctorName = appointmentData.docData?.name;

      if (patientEmail) {
        await sendEmail(
          patientEmail,
          "Appointment Completed",
          `Dear ${
            patientName || "Patient"
          },\n\nYour appointment with Dr. ${doctorName} on ${
            appointmentData.slotDate
          } at ${
            appointmentData.slotTime
          } has been marked as completed.\n\nThank you for visiting.\n\nYour Clinic`
        );
      }

      if (doctorEmail) {
        await sendEmail(
          doctorEmail,
          "Appointment Completed",
          `Dear Dr. ${doctorName},\n\nYou have successfully completed your appointment with ${patientName} on ${appointmentData.slotDate} at ${appointmentData.slotTime}.\n\nRegards,\nYour Clinic`
        );
      }

      return res.json({
        success: true,
        message: "Appointment Completed & Emails sent",
      });
    }

    res.json({ success: false, message: "Appointment Not Found" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const deleteAppointmentDoctor=async(req,res)=>{
  try {
    const { appointmentId ,docId} = req.body;

    const appointment = await appointmentModel.findById(appointmentId);

    if (!appointment || appointment.docId !== docId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    appointment.hideFromDoctor = true;
    await appointment.save();

    res.json({
      success: true,
      message: "Appointment hidden from doctor's view",
    });
  } catch (error) {
    console.error("Error hiding appointment:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// API to get all doctors list for Frontend
const doctorList = async (req, res) => {
    try {

        const doctors = await doctorModel.find({}).select(['-password', '-email'])
        res.json({ success: true, doctors })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to change doctor availablity for Admin and Doctor Panel
const changeAvailablity = async (req, res) => {
    try {

        const { docId } = req.body

        const docData = await doctorModel.findById(docId)
        await doctorModel.findByIdAndUpdate(docId, { available: !docData.available })
        res.json({ success: true, message: 'Availablity Changed' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get doctor profile for  Doctor Panel
const doctorProfile = async (req, res) => {
    try {

        const { docId } = req.body
        const profileData = await doctorModel.findById(docId).select('-password')

        res.json({ success: true, profileData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to update doctor profile data from  Doctor Panel
const updateDoctorProfile = async (req, res) => {
    try {

        const { docId, fees, address, available } = req.body

        await doctorModel.findByIdAndUpdate(docId, { fees, address, available })

        res.json({ success: true, message: 'Profile Updated' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get dashboard data for doctor panel
const doctorDashboard = async (req, res) => {
    try {

        const { docId } = req.body

        const appointments = await appointmentModel.find({ docId })

        let earnings = 0

        appointments.map((item) => {
            if (item.isCompleted || item.payment) {
                earnings += item.amount
            }
        })

        let patients = []

        appointments.map((item) => {
            if (!patients.includes(item.userId)) {
                patients.push(item.userId)
            }
        })



        const dashData = {
            earnings,
            appointments: appointments.length,
            patients: patients.length,
            latestAppointments: appointments.reverse()
        }

        res.json({ success: true, dashData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export {
    loginDoctor,
    appointmentsDoctor,
    appointmentCancel,
    doctorList,
    changeAvailablity,
    appointmentComplete,
    deleteAppointmentDoctor,
    doctorDashboard,
    doctorProfile,
    updateDoctorProfile
}