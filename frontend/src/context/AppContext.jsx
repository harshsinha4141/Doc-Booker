import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from 'axios'

export const AppContext = createContext()

const AppContextProvider = (props) => {

    const currencySymbol = '₹'
    const backendUrl = import.meta.env.VITE_BACKEND_URL

    const [doctors, setDoctors] = useState([])
    const [token, setToken] = useState("");

    const [userData, setUserData] = useState(null);
    const [isLoadingUser,setIsLoadingUser]=useState(true)
    useEffect(() => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        setToken(storedToken);
        console.log(storedToken);
      } else {
        setToken(""); // force reset
        setIsLoadingUser(false); // ✅ ✅ ✅ required
        setUserData(null); // ✅ optional but safe
      }
    }, []);
    const getDoctosData = async () => {

        try {

            const { data } = await axios.get(backendUrl + '/api/doctor/list')
            if (data.success) {
                setDoctors(data.doctors)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }

    }

    // Getting User Profile using API
    const loadUserProfileData = async () => {
        setIsLoadingUser(true);
        try {

            const { data } = await axios.get(backendUrl + '/api/user/get-profile', { headers: { 
                Authorization:`Bearer ${token}`
             }
             });

            if (data.success) {
                setUserData(data.userData)
            } 

        } catch (error) {
            console.log(error)
            setUserData(null);
            toast.error(error.message)
        }
        finally{
            setIsLoadingUser(false);
        }

    }
    

    useEffect(() => {
        getDoctosData()
    }, [])

    useEffect(() => {
        if (token) {
            loadUserProfileData()
        }
    }, [token])

    const value = {
        doctors, getDoctosData,
        currencySymbol,
        backendUrl,
        token, setToken,
        userData, setUserData, loadUserProfileData,isLoadingUser,setIsLoadingUser
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )

}

export default AppContextProvider