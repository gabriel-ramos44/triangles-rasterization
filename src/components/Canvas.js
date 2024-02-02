import React, { useState, useRef } from 'react';
import './styles.css';

const Canvas = () => {
  const [vertices, setVertices] = useState([]);

  const [currentTriangle, setCurrentTriangle] = useState([]);
  const [selectedEdgeColor] = useState('blue');
  const [selectedTriangleIndex, setSelectedTriangleIndex] = useState(null);
  const canvasRef = useRef(null);

function drawTriangleEdges(triangle) {
  const context = canvasRef.current.getContext('2d');
  context.strokeStyle = triangle.edgeColor || selectedEdgeColor;

  context.beginPath();
  context.moveTo(triangle.points[0].x, triangle.points[0].y);
  for (let i = 1; i < triangle.points.length; i++) {
    context.lineTo(triangle.points[i].x, triangle.points[i].y);
  }
  context.lineTo(triangle.points[0].x, triangle.points[0].y);
  context.stroke();
}

function pointIsInsideTriangle(px, py, triangle) {
  const [a, b, c] = triangle.points;

  const vectorAtoC = [c.x - a.x, c.y - a.y];
  const vectorAtoB = [b.x - a.x, b.y - a.y];
  const vectorAtoPoint = [px - a.x, py - a.y];

  const dotProduct00 = vectorAtoC[0] * vectorAtoC[0] + vectorAtoC[1] * vectorAtoC[1];
  const dotProduct01 = vectorAtoC[0] * vectorAtoB[0] + vectorAtoC[1] * vectorAtoB[1];
  const dotProduct02 = vectorAtoC[0] * vectorAtoPoint[0] + vectorAtoC[1] * vectorAtoPoint[1];
  const dotProduct11 = vectorAtoB[0] * vectorAtoB[0] + vectorAtoB[1] * vectorAtoB[1];
  const dotProduct12 = vectorAtoB[0] * vectorAtoPoint[0] + vectorAtoB[1] * vectorAtoPoint[1];

  const invDet = 1 / (dotProduct00 * dotProduct11 - dotProduct01 * dotProduct01);

  const BarycentricCoords = {
    u : (dotProduct11 * dotProduct02 - dotProduct01 * dotProduct12) * invDet,
    v : (dotProduct00 * dotProduct12 - dotProduct01 * dotProduct02) * invDet
  }


  return (BarycentricCoords.u >= 0) && (BarycentricCoords.v >= 0) && (BarycentricCoords.u + BarycentricCoords.v < 1);
}

function fillTriangle(triangle, context) {
  const minY = Math.min(...triangle.points.map(p => p.y));
  const maxY = Math.max(...triangle.points.map(p => p.y));
  const minX = Math.min(...triangle.points.map(p => p.x));
  const maxX = Math.max(...triangle.points.map(p => p.x));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (pointIsInsideTriangle(x, y, triangle)) {

        context.clearRect(x, y, 1, 1);

        const vertices = triangle.points;

        const VerticesToPixeldistances = vertices.map(vertex => {
          return Math.sqrt((x - vertex.x) ** 2 + (y - vertex.y) ** 2);
        });

        const increasedWeights = VerticesToPixeldistances.map(distance => Math.pow(1 / distance, 2));

        const totalDistance = increasedWeights.reduce((a, b) => a + b, 0);
        const normalizedWeights = increasedWeights.map(weight => weight / totalDistance);


        const weightedColors = vertices.map((vertex, index) => {
          const hexColor = vertex.color.slice(1);
          const r = parseInt(hexColor.slice(0, 2), 16);
          const g = parseInt(hexColor.slice(2, 4), 16);
          const b = parseInt(hexColor.slice(4, 6), 16);
          return [r * normalizedWeights[index], g * normalizedWeights[index], b * normalizedWeights[index]];
        });

        const finalColor = weightedColors.reduce((acc, cur) => {
          return [acc[0] + cur[0], acc[1] + cur[1], acc[2] + cur[2]];
        }, [0, 0, 0]);

        context.fillStyle = `rgb(${Math.round(finalColor[0])}, ${Math.round(finalColor[1])}, ${Math.round(finalColor[2])})`;
        context.fillRect(x, y, 1, 1);
      }
    }
  }

}

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const context = canvas.getContext('2d');

    const newPoint = { x, y, color: '#000000' };

    const updatedCurrentTriangle = [...currentTriangle, newPoint];

    if (updatedCurrentTriangle.length === 3) {
      const newTriangle ={ points: updatedCurrentTriangle, edgeColor: 'black' }
      setVertices([...vertices, newTriangle]);
      setCurrentTriangle([]);
      fillTriangle(newTriangle, context);
    } else {
      setCurrentTriangle(updatedCurrentTriangle);
    }
  };


  const clearCanvas = () => {
    setVertices([]);
    setCurrentTriangle([]);
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  const deleteTriangle = (index) => {
    const newVertices = vertices.filter((_, i) => i !== index);
    setVertices(newVertices);

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);

    newVertices.forEach(triangle => {
      fillTriangle(triangle, context);
      drawTriangleEdges(triangle);
    });
  };

  const updateVertexColor = (triangleIndex, vertexIndex, color) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    const updatedVertices = [...vertices];
    updatedVertices[triangleIndex].points[vertexIndex].color = color;
    setVertices(updatedVertices);


    updatedVertices.forEach(triangle => {
      fillTriangle(triangle, context);
      drawTriangleEdges(triangle);

    });
    //fillTriangle(updatedVertices[triangleIndex], context);
  };

  const updateEdgeColor = (index, color) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    const updatedVertices = [...vertices];
    updatedVertices[index].edgeColor = color;
    setVertices(updatedVertices);

    updatedVertices.forEach(triangle => {
      fillTriangle(triangle, context);
      drawTriangleEdges(triangle);

    });
    //drawTriangleEdges(updatedVertices[index]);
  };

  const selectTriangle = (index) => {
    setSelectedTriangleIndex(index);
  };

  return (
    <div className="canvas-container">
      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          width={800}
          height={600}
          style={{ border: '1px solid black' }}
        ></canvas>
        <button onClick={clearCanvas}>Clear</button>
      </div>

      <div className="triangles-list">
        <ul>
          {vertices.map((triangle, triangleIndex) => (
            <li
              key={triangleIndex}
              className={selectedTriangleIndex === triangleIndex ? 'selected' : ''}
              onClick={() => selectTriangle(triangleIndex)}
            >
              <div className="triangle-header">
                <p>Triangle {triangleIndex + 1}</p>
                {selectedTriangleIndex === triangleIndex && (
                  <div className="triangle-options">
                    {triangle.points.map((vertex, vertexIndex) => (
                      <div key={vertexIndex}>
                        Vertex {vertexIndex + 1}:
                        <input
                          type="color"
                          value={vertex.color}
                          onChange={(e) => updateVertexColor(triangleIndex, vertexIndex, e.target.value)}
                        />
                      </div>
                    ))}
                    <div className="edge-color">
                      Edge Color:
                      <input
                        type="color"
                        value={triangle.edgeColor}
                        onChange={(e) => updateEdgeColor(triangleIndex, e.target.value)}
                      />
                    </div>
                    <button onClick={() => deleteTriangle(triangleIndex)}>Delete</button>
                  </div>
                )}
              </div>

            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Canvas;