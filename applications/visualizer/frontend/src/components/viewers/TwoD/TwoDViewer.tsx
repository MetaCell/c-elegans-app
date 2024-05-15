import {useEffect, useRef} from 'react';
import cytoscape from 'cytoscape';
import {useSelectedWorkspace} from "../../../hooks/useSelectedWorkspace.ts";

const TwoDViewer = () => {
    const workspace = useSelectedWorkspace()
    console.log(workspace.activeNeurons)

    const cyContainer = useRef(null);

    useEffect(() => {
        if (!cyContainer.current) return;

        const cy = cytoscape({
            container: cyContainer.current,
            elements: [
                {data: {id: 'a', label: 'Neuron A'}},
                {data: {id: 'b', label: 'Neuron B'}},
                {data: {id: 'ab', source: 'a', target: 'b'}}
            ],
            style: [
                {
                    selector: 'node',
                    style: {
                        'background-color': '#666',
                        'label': 'data(label)',
                        'color': '#000',
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 3,
                        'line-color': '#ccc',
                        'target-arrow-color': '#ccc',
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier'
                    }
                }
            ],
            layout: {
                name: 'grid',
                rows: 1
            }
        });

        return () => {
            cy.destroy();
        };
    }, []);

    return <div ref={cyContainer} style={{width: '100%', height: '100%'}}/>;
};

export default TwoDViewer;