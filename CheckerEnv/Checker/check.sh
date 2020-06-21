#Written by mihai145

# complete here with absolute path to Checker folder
cd D:/CutePetProject/CheckerEnv/Checker

echo "----------"
echo "----------"
echo "----------"

echo "Clearing previous submissions results..."
> compilation.txt
> results.txt

pb=$1
echo "Start checking client code for problem ${pb}!"

cat ./current.txt >> ./main.cpp
echo "Created main.cpp from client submission"

g++ -std=c++14 -Wall ./main.cpp -o ./pb.exe 2> ./compilation.txt

if [[ $? != 0 ]]; then
    > current.txt
    rm main.cpp
    rm pb.exe
    
    echo "Client code did not compile! Deleting client source and exiting..."
    exit 0
fi

echo "Client code compiled successfully!"

problemPath="../Archive/$pb"
numOfTests=$(cat $problemPath/tests/tests.txt)
echo "Problem $pb has $numOfTests tests to check!"

timeLimit=$(cat $problemPath/desc.txt)
echo "TimeLimit is $timeLimit seconds"

cp $problemPath/chk.cpp ./
echo "Copied checker from problem directory"
g++ -std=c++14 -Wall ./chk.cpp -o ./chk.exe
echo "Compiled checker"

re=0
tle=0
wa=0

run_test() {
    path=$1
    test=$2

    # copy .in to checker folder
    cp ${path}/tests/${pb}${test}.in ./${pb}.in
    
    # copy .ok to checker folder
    cp ${path}/tests/${pb}${test}.ok ./${pb}.ok

    #run pb.exe
    timeout $timeLimit ./pb.exe

    exitCode=$?

    if [[ $test == 0 ]]; then
        return 0
    fi

    #code 0-> acc
    #code 1-> wa
    #code 2-> tle
    #code 3-> rte

    if [[ $exitCode == 124 ]]; then
        echo 2 >> ./results.txt
        let tle=tle+1
        rm ${pb}.in
        rm ${pb}.out
        rm ${pb}.ok
        return 0
    elif [[ $exitCode != 0 ]]; then
        echo 3 >> ./results.txt
        let re=re+1
        rm ${pb}.in
        rm ${pb}.out
        rm ${pb}.ok
        return 0
    fi

    # run chk.exe against .out and .ok from checker folder. echo the result to results.txt
    ./chk.exe

    if [[ $? != 0 ]]; then
        echo 1 >> ./results.txt
        let wa=wa+1
    else 
        echo 0 >> ./results.txt
    fi

    # delete .in .ok and .out
    rm ${pb}.in
    rm ${pb}.out
    rm ${pb}.ok
}

counter=0
while [[ $counter -le $numOfTests ]]; do
            run_test $problemPath $counter
            let counter=counter+1 
        done

# echo "Wrong Answer: $wa" >> ./results.txt
# echo "Time Limit Exceeded: $tle" >> ./results.txt
# echo "Runtime Error: $re" >> ./results.txt

rm main.cpp
rm pb.exe
rm chk.cpp
rm chk.exe

echo "Deleted client source & exec and checker & exec"

> current.txt
echo "Cleared current submission"