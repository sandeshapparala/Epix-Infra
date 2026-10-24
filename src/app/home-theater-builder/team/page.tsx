import { StaffOnly } from "@/components/theater-builder/TheaterSession";
import TeamAdmin from "@/components/theater-builder/TeamAdmin";
export default function Page(){return <StaffOnly admin><TeamAdmin/></StaffOnly>;}
