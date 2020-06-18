echo "Start. Waiting 2s..."

g++ ./main.cpp -o ./pb.exe

timeout 2 ./pb.exe

exitCode=$?

if [[ $exitCode == 124 ]]; then
    echo "TLE"
    exit 0
else
    echo "Not tle, exit code is $exitCode"
fi


echo "Done"