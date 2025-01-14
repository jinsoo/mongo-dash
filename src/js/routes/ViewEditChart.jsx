import React, { useState, useEffect } from "react";
import PuffLoader from "react-spinners/PuffLoader";
import axios from "axios";
import toast from "react-hot-toast";
import { useLocation, useParams, useHistory } from "react-router-dom";
import BarLoader from "react-spinners/BarLoader";
import Input from "../components/Input";
import Button from "../components/Button";
import Icons from "../components/Icons";
import TimeseriesLine from "../components/TimeseriesLine";


export default function ViewEditChart({ dashboardId, reloadCharts }) {
    const history = useHistory();
    const location = useLocation();
    const { chartId } = useParams();
    const [chart, setChart] = useState({});
    const [loading, setLoading] = useState(false);
    const [loadingPlotData, setLoadingPlotData] = useState(false);
    const [chartName, setChartName] = useState("");
    const [pipelineId, setPipelineId] = useState(null);
    const [chartType, setChartType] = useState("TimeseriesLine");
    const [pipelines, setPipelines] = useState([]);
    const [pipeline, setPipeline] = useState({
        pipeline_id: null,
        name: null,
        collection: null,
        stages: null,
    });
    const [plotData, setPlotData] = useState([]);

    const getChart = async (cancelToken) => {
        try {
            setLoading(true);
            getPipelines(cancelToken);
            const result = await axios.get("/api/dashboards/charts/view", {
                params: { chart_id: chartId, dashboard_id: dashboardId },
            });
            setChart(result.data);
            setChartName(result.data.name);
            setChartType(result.data.type_);
            setPipelineId(result.data.pipeline_id);
            getPipeline(result.data.pipeline_id, cancelToken);
            setLoading(false);
            getPlotData(result.data.pipeline_id, cancelToken);
        } catch (error) {
            console.error(error);
        }
    };

    const getPipelines = async (cancelToken) => {
        try {
            const result = await axios.get("/api/pipelines/view_all", {
                cancelToken: cancelToken.token
            });
            setPipelines(result.data);
        } catch (error) {
            console.error(error);
        }
    };
    const getPipeline = async (pipelineId, cancelToken) => {
        try {
            const result = await axios.get(`/api/pipelines/view`, {
                cancelToken: cancelToken.token,
                params: { pipeline_id: pipelineId },
            });
            setPipeline(result.data);
        } catch (error) {
            if (!axios.isCancel(error)) {
                toast.error("Error retrieving pipeline details");
            }
        }
    };
    const getPlotData = async (pipelineId, cancelToken) => {
        try {
            setLoadingPlotData(true);
            const { data } = await axios.get("/api/pipelines/run", {
                cancelToken: cancelToken.token,
                params: {
                    pipeline_id: pipelineId,
                    limit: 5000,
                },
            });
            const groupedData = [];
            const uniqueKeys = [...new Set(data.map((d) => d.grouping))];
            uniqueKeys.map((key) => {
                const filtered = data.filter((d) => d.grouping == key);
                const x = filtered.map((d) => d.x);
                const y = filtered.map((d) => d.y);
                groupedData.push({
                    x,
                    y,
                    type: "scatter",
                    mode: "lines",
                    name: key,
                });
            });
            setPlotData(groupedData);
            setLoadingPlotData(false);
        } catch (error) {
            setLoadingPlotData(false);
            if (!axios.isCancel(error)) {
                toast.error("Error running pipeline!");
            }
        }
    };
    const editChart = async () => {
        try {
            await axios.post(
                "/api/dashboards/charts/edit",
                {
                    id: chartId,
                    name: chartName,
                    pipeline_id: pipelineId,
                    type_: "TimeseriesLine",
                    x_axis: {
                        label: "X-axis",
                        key: "x",
                    },
                    y_axis: {
                        label: "Y-axis",
                        key: "y",
                    },
                    grouping: "",
                },
                { params: { dashboard_id: dashboardId } }
            );
            toast.success("Chart successfully registered!");
            reloadCharts();
        } catch (error) {
            console.error(error);
            toast.error("Error registering chart!");
        }
    };
    const deleteChart = async () => {
        try {
            await axios.delete("/api/dashboards/charts/delete", {
                params: { dashboard_id: dashboardId, chart_id: chartId },
            });
            toast.success("Chart successfully deleted!");
            reloadCharts();
            history.push(`/dashboards/edit/${dashboardId}`);
        } catch (error) {
            console.error(error);
            toast.error("Error deleting chart!");
        }
    };

    useEffect(() => {
        const cancelToken = axios.CancelToken.source();
        getChart(cancelToken);
        return () => {
            cancelToken.cancel();
        }
    }, [location.key]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-full">
                <p className="mb-2">Fetching chart...</p>
                <BarLoader color={"#22C55E"} loading={loading} size={80} />
            </div>
        );
    }

    return (
        <div className="p-4">
            <h2 className="text-3xl text-blueGray-800 font-bold mb-4">
                <span className="font-light">Chart | </span> {chart.name}
            </h2>
            <p className="text-blueGray-800 mb-4">
                Fill in the details below to add a chart.
            </p>
            <div className="grid grid-cols-12 gap-4">
                <div className="col-span-4">
                    <Input.Text
                        name="Name"
                        value={chartName}
                        onChange={(e) => setChartName(e.target.value)}
                    />
                </div>
                <div className="col-span-4">
                    <Input.Select
                        name="Pipelines"
                        value={pipelineId}
                        values={pipelines.map((p) => [p._id, p.name])}
                        onChange={(e) => {
                            setPipelineId(e.target.value);
                            getPipeline(e.target.value);
                            getPlotData(e.target.value);
                        }}
                    />
                </div>
                <div className="col-span-4">
                    <Input.Select
                        name="Chart type"
                        value={chartType}
                        values={[["TimeseriesLine", "Timeseries line chart"]]}
                        onChange={(e) => setChartType(e.target.value)}
                    />
                </div>
                <div className="col-span-4">
                    <div className="border border-blueGray-200 p-3 inline-block rounded-md">
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
                </div>
            </div>
            {loadingPlotData && (
                <div className="flex w-full justify-center h-full py-14 items-center">
                    <PuffLoader color={"#22C55E"} loading={loadingPlotData} size={80} />
                </div>
            )}
            <div className="my-2">
                {!loadingPlotData && plotData.length > 0 && (
                    <TimeseriesLine height={400} data={plotData} />
                )}
                {!loadingPlotData && plotData.length == 0 && (
                    <div className="py-24 flex items-center justify-center">
                        <h4 className="text-lg text-blueGray-400 font-semibold">
                            No data found!
                        </h4>
                    </div>
                )}
            </div>
            <div className="flex items-center">
                <Button.Primary onClick={editChart}>Update chart</Button.Primary>
                <Button.Danger onClick={deleteChart}>
                    <div className="flex items-center">
                        <Icons.Cross className="w-4 h-4 mr-2" />
                        Delete chart
                    </div>
                </Button.Danger>

            </div>
        </div>
    );
}
