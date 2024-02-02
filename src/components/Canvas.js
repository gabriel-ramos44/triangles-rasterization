import React, { useState, useRef, useEffect } from 'react';
import './styles.css';

const Canvas = () => {
  const [vertices, setVertices] = useState([]);
  const [currentTriangle, setCurrentTriangle] = useState([]);
  const [selectedEdgeColor, setSelectedEdgeColor] = useState('blue');
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
  context.lineTo(triangle.points[0].x, triangle.points[0].y); // Fecha o caminho de volta ao primeiro ponto
  context.stroke();
}


useEffect(() => {
  const canvas = canvasRef.current;
  const context = canvas.getContext('2d');

  // Função auxiliar para determinar se um ponto está dentro de um triângulo
  function pointInTriangle(px, py, triangle) {
    const [a, b, c] = triangle.points;

    // Calcula vetores a partir dos vértices do triângulo
    const v0 = [c.x - a.x, c.y - a.y]; // Vetor que vai do vert a ao vert c
    const v1 = [b.x - a.x, b.y - a.y]; // a ao b
    const v2 = [px - a.x, py - a.y];   // a ao ponto px py

    // Calcula os produtos escalares de vetores relevantes
    const dot00 = v0[0] * v0[0] + v0[1] * v0[1]; // v0 com v0
    const dot01 = v0[0] * v1[0] + v0[1] * v1[1]; // v0 com v1
    const dot02 = v0[0] * v2[0] + v0[1] * v2[1];
    const dot11 = v1[0] * v1[0] + v1[1] * v1[1];
    const dot12 = v1[0] * v2[0] + v1[1] * v2[1];

    // determinante e o inverso do det
    const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);

    // coordenadas barycentricas do ponto
    const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    const v = (dot00 * dot12 - dot01 * dot02) * invDenom;

    // Dentro se coords barycentricas estiverem dentro do intervalo [0, 1] e a soma u + v for menor que 1
    return (u >= 0) && (v >= 0) && (u + v < 1);
  }

// Função para preencher um triângulo com interpolação de cores ponderada
function fillTriangle(triangle) {
  console.log('entrou')
  const minY = Math.min(...triangle.points.map(p => p.y));
  const maxY = Math.max(...triangle.points.map(p => p.y));
  const minX = Math.min(...triangle.points.map(p => p.x));
  const maxX = Math.max(...triangle.points.map(p => p.x));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (pointInTriangle(x, y, triangle)) {
        //context.clearRect(x, y, 1, 1);

        const vertices = triangle.points;

        // Calcular as distâncias dos vértices a cada pixel
        // distância euclidiana:
        // distância = sqrt((x2 - x1)^2 + (y2 - y1)^2),
        // onde (x1, y1) coords do vértice e (x2, y2) coordenadas do pixel.
        const distances = vertices.map(vertex => {
          return Math.sqrt((x - vertex.x) ** 2 + (y - vertex.y) ** 2);
        });

        // quanto mais próximo um vértice estiver de um pixel, mais influência ele terá na cor desse pixel
        // O fator 3 é usado para dar mais peso  aos vértices próximos
        const increasedWeights = distances.map(distance => Math.pow(1 / distance, 2));

        // Calcular as distâncias ponderadas e normalizá-las
        // Normalizamos os pesos dividindo cada peso pelo total das somas dos pesos
        const totalDistance = increasedWeights.reduce((a, b) => a + b, 0);
        const normalizedWeights = increasedWeights.map(weight => weight / totalDistance);


        // Calcular as cores ponderadas
        /*
        Para cada vértice, convertemos sua cor em um formato numérico
        multiplicamos cada componente de cor (vermelho, verde e azul)
        pelo peso correspondente e somamos esses produtos para cada vertc
        */
        const weightedColors = vertices.map((vertex, index) => {
          const hexColor = vertex.color.slice(1); // Remove o símbolo '#' do início
          const r = parseInt(hexColor.slice(0, 2), 16);
          const g = parseInt(hexColor.slice(2, 4), 16);
          const b = parseInt(hexColor.slice(4, 6), 16);
          return [r * normalizedWeights[index], g * normalizedWeights[index], b * normalizedWeights[index]];
        });

        // Calcular a cor final somando as cores ponderadas de todos os vertices
        const finalColor = weightedColors.reduce((acc, cur) => {
          return [acc[0] + cur[0], acc[1] + cur[1], acc[2] + cur[2]];
        }, [0, 0, 0]);


        // Definir a cor do pixel com base na cor final calculada
        //context.fillStyle = `rgb(${Math.round(finalColor[0])}, ${Math.round(finalColor[1])}, ${Math.round(finalColor[2])})`;
        context.fillStyle = `rgb(${Math.round(finalColor[0])}, ${Math.round(finalColor[1])}, ${Math.round(finalColor[2])})`;
        context.fillRect(x, y, 1, 1);
      }
    }
  }

}

  // Limpa o canvas e desenha os triângulos existentes
  context.clearRect(0, 0, canvas.width, canvas.height);
  vertices.forEach(triangle => {
    fillTriangle(triangle);
    drawTriangleEdges(triangle);

  });
}, [vertices, selectedEdgeColor]);

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Cria um novo ponto com cor padrão
    const newPoint = { x, y, color: '#000000' };

    const updatedCurrentTriangle = [...currentTriangle, newPoint];

    // Se o triângulo estiver completo, adicione-o à lista e comece um novo triângulo
    if (updatedCurrentTriangle.length === 3) {
      setVertices([...vertices, { points: updatedCurrentTriangle, edgeColor: 'black' }]);
      setCurrentTriangle([]);
    } else {
      // Se não, apenas atualize o triângulo atual
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

  // Função para excluir um triângulo específico
  const deleteTriangle = (index) => {
    const newVertices = vertices.filter((_, i) => i !== index);
    setVertices(newVertices);
  };

  // Função para atualizar a cor de um vértice
  const updateVertexColor = (triangleIndex, vertexIndex, color) => {
    const updatedVertices = [...vertices];
    updatedVertices[triangleIndex].points[vertexIndex].color = color;
    setVertices(updatedVertices);
  };

  // Função para atualizar a cor das arestas de um triângulo
  const updateEdgeColor = (index, color) => {
    const updatedVertices = [...vertices];
    updatedVertices[index].edgeColor = color;
    setVertices(updatedVertices);
  };


  // Função para selecionar um triângulo
  const selectTriangle = (index) => {
    setSelectedTriangleIndex(index);
  };


  return (
    <div className="canvas-container">
      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          width={1200}
          height={700}
          style={{ border: '1px solid black' }}
        ></canvas>
        <button onClick={clearCanvas}>Limpar</button>
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
                <a>Triangle {triangleIndex + 1}</a>
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
                    <button onClick={() => deleteTriangle(triangleIndex)}>Excluir</button>
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