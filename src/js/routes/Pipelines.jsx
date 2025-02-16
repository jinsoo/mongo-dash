import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    useRouteMatch,
    useLocation,
    Switch,
    Route,
    Link,
    NavLink
} from "react-router-dom";
import AddPipeline from "./AddPipeline";
import ViewEditPipeline from "./ViewEditPipeline";
import Button from "../components/Button";
import BarLoader from "react-spinners/BarLoader";

export default function Pipelines() {
    const location = useLocation();
    let match = useRouteMatch();
    const [loading, setLoading] = useState(false);
    const [pipelines, setPipelines] = useState([]);
    const getPipelines = async () => {
        setLoading(true);
        const result = await axios.get("/api/pipelines/view_all");
        setPipelines(result.data);
        setLoading(false);
    };
    useEffect(() => {
        getPipelines();
    }, []);
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-full">
                <p className="mb-2">Fetching pipelines...</p>
                <BarLoader color={"#22C55E"} loading={loading} size={80} />
            </div>
        );
    }
    return (
        <div className="grid grid-cols-4 divide-x divide-blueGray-200 bg-white">
            <div>
                <div className="p-4">
                    <h2 className="text-3xl text-blueGray-800 font-bold mb-4">
                        Pipelines
                    </h2>
                    <p className="text-blueGray-800 mb-4">
                        Below is a list of your registered pipelines.
                    </p>
                    <div className="my-4">
                        <Link to={`${match.path}/add`}>
                            <Button.Primary>Add pipeline</Button.Primary>
                        </Link>
                    </div>
                </div>
                <div className="border-t border-blueGray-200 bg-white">
                    {pipelines.map((pipeline) => (
                        <NavLink
                            key={pipeline._id}
                            to={`${match.path}/view/${pipeline._id}`}
                            activeClassName="border-green-600"
                            className="block border-l-4 border-white hover:bg-blueGray-50 transition-colors duration-300"
                        >
                            <div className="border-b border-blueGray-200 p-4">
                                <h4 className="text-md text-blueGray-800 font-bold mb-2">
                                    {pipeline.name}
                                </h4>
                                <div className="flex gap-x-8">
                                    <div>
                                        <h6 className="text-blueGray-400 font-bold uppercase text-xs">
                                            Database name
                                        </h6>
                                        <h4 className="text-blueGray-800 text-sm">
                                            {pipeline.database_name}
                                        </h4>
                                    </div>
                                    <div>
                                        <h6 className="text-blueGray-400 font-bold uppercase text-xs">
                                            Collection
                                        </h6>
                                        <h4 className="text-blueGray-800 text-sm">
                                            {pipeline.collection}
                                        </h4>
                                    </div>
                                </div>
                            </div>
                        </NavLink>
                    ))}
                </div>
            </div>
            <div className="col-span-3 h-full">
                <Switch>
                    <Route path={`${match.path}/add`}>
                        <AddPipeline reloadPipelines={getPipelines} />
                    </Route>
                    <Route path={`${match.path}/view/:pipelineId`}>
                        <ViewEditPipeline reloadPipelines={getPipelines} />
                    </Route>
                    <Route path={`${match.path}`}>
                        <div className="w-full h-full flex items-center justify-center bg-blueGray-100">
                            Please select a pipeline
                        </div>
                    </Route>
                </Switch>
            </div>
        </div>
    );
}
